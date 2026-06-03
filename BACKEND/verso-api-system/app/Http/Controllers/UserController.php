<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Favorite;
use App\Models\Friendship;
use App\Models\ReadingHistory;
use App\Models\ReadingSession;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /** A user is considered online if seen within this many seconds. */
    private const ONLINE_WINDOW = 60;

    /**
     * Search people by name/email for the combined search dropdown.
     * Excludes the requesting user. Includes friendship status.
     */
    public function search(Request $request): JsonResponse
    {
        $me   = $request->user();
        $term = trim((string) $request->query('q', ''));

        if (mb_strlen($term) < 2) {
            return response()->json(['data' => []]);
        }

        $users = User::query()
            ->where('id', '!=', $me->id)
            ->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%");
            })
            ->orderBy('name')
            ->limit(8)
            ->get(['id', 'name', 'avatar_url', 'role', 'last_seen_at']);

        return response()->json([
            'data' => $users->map(fn ($u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'avatarUrl'    => $u->avatar_url,
                'role'         => $u->role,
                'online'       => $this->isOnline($u),
                'friendStatus' => $me->friendStatusWith($u->id),
            ]),
        ]);
    }

    /**
     * Public profile of another user (or self).
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $me   = $request->user();
        $user = User::findOrFail($id);

        $friendCount = Friendship::query()
            ->where('status', 'accepted')
            ->where(function ($q) use ($id) {
                $q->where('requester_id', $id)->orWhere('addressee_id', $id);
            })
            ->count();

        $stats = [
            'booksCompleted' => ReadingHistory::where('user_id', $id)->where('progress', 100)->count(),
            'favorites'      => Favorite::where('user_id', $id)->count(),
            'reviews'        => Review::where('user_id', $id)->count(),
            'hoursRead'      => (int) round(
                ((int) ReadingSession::where('user_id', $id)->sum('duration_minutes')) / 60
            ),
        ];

        $isSelf       = $me->id === $user->id;
        $friendStatus = $isSelf ? 'self' : $me->friendStatusWith($user->id);

        // Surface the pending friendship id so the client can accept/decline directly.
        $pendingRequestId = null;
        if ($friendStatus === 'request_received') {
            $pendingRequestId = optional($me->friendshipWith($user->id))->id;
        }

        $publishedBooksCount = Book::where('author_id', $id)->count();

        return response()->json([
            'id'                  => $user->id,
            'name'                => $user->name,
            'avatarUrl'           => $user->avatar_url,
            'role'                => $user->role,
            'bio'                 => $user->bio,
            'bannerColor'         => $user->banner_color,
            'points'              => $user->points,
            'online'              => $this->isOnline($user),
            'lastSeenAt'          => optional($user->last_seen_at)->toIso8601String(),
            'friendCount'         => $friendCount,
            'publishedBooksCount' => $publishedBooksCount,
            'stats'               => $stats,
            'isSelf'              => $isSelf,
            'friendStatus'        => $friendStatus,
            'pendingRequestId'    => $pendingRequestId,
        ]);
    }

    private function isOnline(User $u): bool
    {
        return $u->last_seen_at !== null
            && $u->last_seen_at->gt(now()->subSeconds(self::ONLINE_WINDOW));
    }
}
