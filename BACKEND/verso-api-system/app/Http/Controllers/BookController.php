<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BookController extends Controller
{
    public function home(): JsonResponse
    {
        // Cached for 5 minutes. The per-user bookmark/favorite flags are hidden
        // below (the home shelves never use them), so the payload is identical
        // for every user and safe to share under a single cache key.
        $payload = Cache::remember('books.home', 300, function () {
            $hidden = ['is_bookmarked', 'is_favorited'];

            $latest = Book::approved()->orderBy('created_at', 'desc')->limit(10)->get()->makeHidden($hidden);

            $recommended = Book::approved()->orderBy('average_rating', 'desc')->limit(10)->get()->makeHidden($hidden);

            $exclusive = Book::approved()->where('is_exclusive', true)->orderBy('average_rating', 'desc')->limit(10)->get()->makeHidden($hidden);

            $highlyRated = Book::approved()->has('reviews', '>=', 3)
                ->orderBy('average_rating', 'desc')
                ->limit(10)
                ->get()
                ->makeHidden($hidden);

            $topFavoriteBookIds = Favorite::selectRaw('book_id, count(*) as fav_count')
                ->groupBy('book_id')
                ->orderByDesc('fav_count')
                ->limit(10)
                ->pluck('book_id');

            $favorites = Book::approved()->whereIn('id', $topFavoriteBookIds)->get()->makeHidden($hidden);

            // Return plain arrays (not Eloquent collections) so the cached
            // payload serializes cleanly under the database cache driver. Cached
            // collection objects come back as __PHP_Incomplete_Class on a cache
            // hit and json_encode to "{}" instead of "[]". makeHidden() above is
            // respected by toArray().
            return [
                'latest'      => $latest->toArray(),
                'recommended' => $recommended->toArray(),
                'exclusive'   => $exclusive->toArray(),
                'highly_rated' => $highlyRated->toArray(),
                'favorites'   => $favorites->toArray(),
            ];
        });

        return response()->json($payload);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Book::approved();

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                  ->orWhere('author', 'like', "%{$term}%");
            });
        }

        if ($request->filled('genre')) {
            $query->where('genre', $request->genre);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $book = Book::withCount('reviews')
            ->with(['reviews.user:id,name,avatar_url', 'authorUser:id,name,avatar_url'])
            ->findOrFail($id);

        // Non-approved books are only visible to their author or an admin.
        if ($book->status !== Book::STATUS_APPROVED) {
            $viewer = $request->user();
            $canView = $viewer && ($viewer->id === $book->author_id || $viewer->role === 'admin');
            if (! $canView) {
                abort(404);
            }
        }

        return response()->json($book);
    }

    public function byAuthor(int $userId): JsonResponse
    {
        $books = Book::approved()
            ->where('author_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($books);
    }

    public function myUploads(Request $request): JsonResponse
    {
        $books = Book::where('author_id', $request->user()->id)
            ->withCount(['reviews', 'favorites'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($books);
    }
}
