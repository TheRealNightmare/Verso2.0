<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Favorite;
use App\Models\ReadingHistory;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class RecommendationService
{
    // Scoring weights for the book ranking.
    private const W_GENRE  = 3.0;
    private const W_COLLAB = 2.0;
    private const W_RATING = 0.2;

    private const CACHE_TTL_HOURS = 24;

    public function __construct(private GeminiService $gemini)
    {
    }

    public static function booksCacheKey(int $userId): string
    {
        return "recs:books:{$userId}";
    }

    public static function peopleCacheKey(int $userId): string
    {
        return "recs:people:{$userId}";
    }

    /**
     * Forget cached recommendations for a user (call when their taste changes).
     */
    public static function forget(int $userId): void
    {
        Cache::forget(self::booksCacheKey($userId));
        Cache::forget(self::peopleCacheKey($userId));
    }

    /**
     * @return array{books: array, coldStart: bool}
     */
    public function booksFor(User $user, int $limit = 12): array
    {
        return Cache::remember(
            self::booksCacheKey($user->id),
            now()->addHours(self::CACHE_TTL_HOURS),
            fn () => $this->computeBooks($user, $limit)
        );
    }

    /**
     * @return array list of shaped users
     */
    public function peopleFor(User $user, int $limit = 8): array
    {
        return Cache::remember(
            self::peopleCacheKey($user->id),
            now()->addHours(self::CACHE_TTL_HOURS),
            fn () => $this->computePeople($user, $limit)
        );
    }

    // ----------------------------------------------------------------------
    // Books
    // ----------------------------------------------------------------------

    private function computeBooks(User $user, int $limit): array
    {
        $readBookIds = ReadingHistory::where('user_id', $user->id)
            ->whereNotNull('book_id')
            ->pluck('book_id');
        $favBookIds = Favorite::where('user_id', $user->id)->pluck('book_id');
        $reviewedBookIds = Review::where('user_id', $user->id)->pluck('book_id');

        $excluded = $readBookIds->merge($favBookIds)->merge($reviewedBookIds)->unique()->values();

        // Cold start: no signal at all → fall back to popularity.
        if ($excluded->isEmpty()) {
            return [
                'books'     => $this->popularBooks($limit)->map(fn ($b) => $this->shapeBook($b))->values()->all(),
                'coldStart' => true,
            ];
        }

        // Genre weights from what the user read / favorited / rated highly.
        $genreWeights = $this->genreWeights($user, $readBookIds, $favBookIds);

        // Collaborative signal: how many "similar users" (who share a favorite
        // with us) favorited each candidate book.
        $collabCounts = $this->collaborativeCounts($user, $favBookIds, $excluded);

        $candidates = Book::whereNotIn('id', $excluded)
            ->when($genreWeights->isNotEmpty(), fn ($q) => $q->whereIn('genre', $genreWeights->keys()->all()))
            ->limit(400)
            ->get();

        // If genre-filtered pool is empty (e.g. niche taste), widen to everything.
        if ($candidates->isEmpty()) {
            $candidates = Book::whereNotIn('id', $excluded)->limit(400)->get();
        }

        $scored = $candidates->map(function (Book $book) use ($genreWeights, $collabCounts) {
            $genreScore  = ($book->genre ? ($genreWeights[$book->genre] ?? 0) : 0) * self::W_GENRE;
            $collabScore = ($collabCounts[$book->id] ?? 0) * self::W_COLLAB;
            $ratingScore = (float) $book->average_rating * self::W_RATING;

            return [
                'book'  => $book,
                'score' => $genreScore + $collabScore + $ratingScore,
            ];
        })
            ->sortByDesc('score')
            ->values();

        // Take a slightly larger pool for Gemini to re-rank.
        $pool = $scored->take($limit * 2);

        $ranked = $this->geminiRerank($user, $genreWeights, $readBookIds, $favBookIds, $pool);

        return [
            'books'     => collect($ranked)->take($limit)->values()->all(),
            'coldStart' => false,
        ];
    }

    /**
     * Re-rank the candidate pool with Gemini when available; otherwise keep the
     * algorithmic order. Returns shaped books (with optional `reason`).
     */
    private function geminiRerank(User $user, $genreWeights, $readBookIds, $favBookIds, $pool): array
    {
        $byId = $pool->keyBy(fn ($row) => $row['book']->id);

        if (! $this->gemini->enabled()) {
            return $pool->map(fn ($row) => $this->shapeBook($row['book']))->all();
        }

        $context = [
            'top_genres'      => $genreWeights->keys()->take(5)->values()->all(),
            'recent_titles'   => Book::whereIn('id', $readBookIds->take(8))->pluck('title')->all(),
            'favorite_titles' => Book::whereIn('id', $favBookIds->take(8))->pluck('title')->all(),
        ];

        $candidates = $pool->map(fn ($row) => [
            'id'     => $row['book']->id,
            'title'  => $row['book']->title,
            'author' => $row['book']->author,
            'genre'  => $row['book']->genre,
            'score'  => round($row['score'], 2),
        ])->all();

        $result = $this->gemini->rerankBookRecommendations($context, $candidates);

        if (! $result) {
            return $pool->map(fn ($row) => $this->shapeBook($row['book']))->all();
        }

        $ordered = [];
        $usedIds = [];
        foreach ($result['items'] as $item) {
            $row = $byId->get($item['id']);
            if (! $row) {
                continue;
            }
            $ordered[] = $this->shapeBook($row['book'], $item['reason'] ?? null);
            $usedIds[] = $item['id'];
        }

        // Append any pool books Gemini omitted, preserving algorithmic order.
        foreach ($pool as $row) {
            if (! in_array($row['book']->id, $usedIds, true)) {
                $ordered[] = $this->shapeBook($row['book']);
            }
        }

        return $ordered;
    }

    private function genreWeights(User $user, $readBookIds, $favBookIds)
    {
        // Books the user engaged with positively: read + favorited + rated >= 4.
        $highlyRatedBookIds = Review::where('user_id', $user->id)
            ->where('rating', '>=', 4)
            ->pluck('book_id');

        $bookIds = $readBookIds->merge($favBookIds)->merge($highlyRatedBookIds)->unique();

        $genres = Book::whereIn('id', $bookIds)
            ->whereNotNull('genre')
            ->pluck('genre');

        if ($genres->isEmpty()) {
            return collect();
        }

        $counts = $genres->countBy();
        $max = $counts->max() ?: 1;

        // Normalize to 0..1 weights.
        return $counts->map(fn ($c) => $c / $max);
    }

    /**
     * Map of book_id => count of favorites by users who share a favorite with us.
     */
    private function collaborativeCounts(User $user, $favBookIds, $excluded)
    {
        if ($favBookIds->isEmpty()) {
            return collect();
        }

        $similarUserIds = Favorite::whereIn('book_id', $favBookIds)
            ->where('user_id', '!=', $user->id)
            ->distinct()
            ->pluck('user_id');

        if ($similarUserIds->isEmpty()) {
            return collect();
        }

        return Favorite::select('book_id', DB::raw('count(*) as cnt'))
            ->whereIn('user_id', $similarUserIds)
            ->whereNotIn('book_id', $excluded)
            ->groupBy('book_id')
            ->pluck('cnt', 'book_id');
    }

    private function popularBooks(int $limit)
    {
        $topFavoriteBookIds = Favorite::selectRaw('book_id, count(*) as fav_count')
            ->groupBy('book_id')
            ->orderByDesc('fav_count')
            ->limit($limit)
            ->pluck('book_id');

        $books = Book::whereIn('id', $topFavoriteBookIds)->get();

        // Top off with highly-rated books if we don't have enough favorites yet.
        if ($books->count() < $limit) {
            $extra = Book::whereNotIn('id', $books->pluck('id'))
                ->orderByDesc('average_rating')
                ->limit($limit - $books->count())
                ->get();
            $books = $books->concat($extra);
        }

        return $books->take($limit);
    }

    private function shapeBook(Book $book, ?string $reason = null): array
    {
        return [
            'id'              => $book->id,
            'title'           => $book->title,
            'author'          => $book->author,
            'cover_image_url' => $book->cover_image_url,
            'genre'           => $book->genre,
            'average_rating'  => $book->average_rating,
            'reason'          => $reason,
        ];
    }

    // ----------------------------------------------------------------------
    // People
    // ----------------------------------------------------------------------

    private function computePeople(User $user, int $limit): array
    {
        $myFavBookIds = Favorite::where('user_id', $user->id)->pluck('book_id');
        $myGenres = $this->genreWeights(
            $user,
            ReadingHistory::where('user_id', $user->id)->whereNotNull('book_id')->pluck('book_id'),
            $myFavBookIds
        )->keys();

        // Exclude self + anyone we already have a friendship row with (friends or pending).
        $excludedUserIds = collect([$user->id])
            ->merge($user->friendIds())
            ->merge($user->sentFriendships()->pluck('addressee_id'))
            ->merge($user->receivedFriendships()->pluck('requester_id'))
            ->unique();

        // Shared favorites: users who favorited the same books as us.
        $sharedFavCounts = $myFavBookIds->isEmpty()
            ? collect()
            : Favorite::select('user_id', DB::raw('count(*) as cnt'))
                ->whereIn('book_id', $myFavBookIds)
                ->whereNotIn('user_id', $excludedUserIds)
                ->groupBy('user_id')
                ->pluck('cnt', 'user_id');

        // Candidate users: those who share a favorite, or read in our genres.
        $genreUserIds = collect();
        if ($myGenres->isNotEmpty()) {
            $genreBookIds = Book::whereIn('genre', $myGenres->all())->pluck('id');
            if ($genreBookIds->isNotEmpty()) {
                $genreUserIds = ReadingHistory::whereIn('book_id', $genreBookIds)
                    ->whereNotIn('user_id', $excludedUserIds)
                    ->distinct()
                    ->pluck('user_id');
            }
        }

        $candidateIds = $sharedFavCounts->keys()->merge($genreUserIds)->unique()->values();
        if ($candidateIds->isEmpty()) {
            return [];
        }

        $candidates = User::whereIn('id', $candidateIds)->limit(200)->get();

        $scored = $candidates->map(function (User $other) use ($sharedFavCounts, $myGenres) {
            $mutualFav = (int) ($sharedFavCounts[$other->id] ?? 0);

            // Genres this candidate engages with, intersected with ours.
            $otherBookIds = ReadingHistory::where('user_id', $other->id)
                ->whereNotNull('book_id')
                ->pluck('book_id')
                ->merge(Favorite::where('user_id', $other->id)->pluck('book_id'))
                ->unique();
            $otherGenres = Book::whereIn('id', $otherBookIds)
                ->whereNotNull('genre')
                ->pluck('genre')
                ->unique();
            $sharedGenres = $otherGenres->intersect($myGenres)->values();

            $score = ($mutualFav * 3) + ($sharedGenres->count() * 2);

            return [
                'user'         => $other,
                'score'        => $score,
                'sharedGenres' => $sharedGenres->all(),
                'mutualFav'    => $mutualFav,
            ];
        })
            ->filter(fn ($row) => $row['score'] > 0)
            ->sortByDesc('score')
            ->take($limit)
            ->values();

        return $scored->map(fn ($row) => [
            'id'             => $row['user']->id,
            'name'           => $row['user']->name,
            'avatarUrl'      => $row['user']->avatar_url,
            'role'           => $row['user']->role,
            'sharedGenres'   => $row['sharedGenres'],
            'mutualFavorites' => $row['mutualFav'],
            'friendStatus'   => $user->friendStatusWith($row['user']->id),
        ])->all();
    }
}
