<?php

namespace App\Http\Controllers;

use App\Events\FriendRequestAccepted;
use App\Events\FriendRequestReceived;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FriendshipController extends Controller
{
    private const ONLINE_WINDOW = 60;

    /** My accepted friends. */
    public function index(Request $request): JsonResponse
    {
        $me  = $request->user();
        $ids = $me->friendIds();

        $friends = User::whereIn('id', $ids)
            ->orderBy('name')
            ->get(['id', 'name', 'avatar_url', 'last_seen_at']);

        return response()->json([
            'data' => $friends->map(fn ($u) => $this->userSummary($u)),
        ]);
    }

    /** Incoming pending friend requests addressed to me. */
    public function requests(Request $request): JsonResponse
    {
        $me = $request->user();

        $pending = Friendship::with('requester:id,name,avatar_url,last_seen_at')
            ->where('addressee_id', $me->id)
            ->where('status', 'pending')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $pending->map(fn ($f) => [
                'requestId' => $f->id,
                'user'      => $this->userSummary($f->requester),
                'createdAt' => $f->created_at->toIso8601String(),
            ]),
            'count' => $pending->count(),
        ]);
    }

    /** Send a friend request. */
    public function store(Request $request): JsonResponse
    {
        $me = $request->user();

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $otherId = (int) $validated['user_id'];

        if ($otherId === $me->id) {
            abort(422, 'You cannot add yourself.');
        }

        $existing = $me->friendshipWith($otherId);

        if ($existing) {
            // If they already sent ME a pending request, accept it instead of duplicating.
            if ($existing->status === 'pending' && $existing->addressee_id === $me->id) {
                return $this->acceptFriendship($existing, $me);
            }

            return response()->json([
                'status' => $me->friendStatusWith($otherId),
            ], 200);
        }

        $friendship = Friendship::create([
            'requester_id' => $me->id,
            'addressee_id' => $otherId,
            'status'       => 'pending',
        ]);

        broadcast(new FriendRequestReceived($otherId, [
            'requestId' => $friendship->id,
            'from'      => $this->userSummary($me),
        ]))->toOthers();

        return response()->json([
            'status'    => 'request_sent',
            'requestId' => $friendship->id,
        ], 201);
    }

    /** Accept a pending request addressed to me. */
    public function accept(Request $request, int $id): JsonResponse
    {
        $me         = $request->user();
        $friendship = Friendship::findOrFail($id);

        if ($friendship->addressee_id !== $me->id) {
            abort(403, 'This request is not addressed to you.');
        }

        if ($friendship->status === 'accepted') {
            return response()->json(['status' => 'friends']);
        }

        return $this->acceptFriendship($friendship, $me);
    }

    /** Decline a pending request addressed to me. */
    public function decline(Request $request, int $id): JsonResponse
    {
        $me         = $request->user();
        $friendship = Friendship::findOrFail($id);

        if ($friendship->addressee_id !== $me->id) {
            abort(403, 'This request is not addressed to you.');
        }

        $friendship->delete();

        return response()->json(['status' => 'none']);
    }

    /** Unfriend, or cancel a request I sent (works in either direction). */
    public function destroy(Request $request, int $userId): JsonResponse
    {
        $me         = $request->user();
        $friendship = $me->friendshipWith($userId);

        if ($friendship) {
            $friendship->delete();
        }

        return response()->json(['status' => 'none']);
    }

    private function acceptFriendship(Friendship $friendship, User $me): JsonResponse
    {
        $friendship->update(['status' => 'accepted']);

        broadcast(new FriendRequestAccepted($friendship->requester_id, [
            'by' => $this->userSummary($me),
        ]))->toOthers();

        return response()->json(['status' => 'friends']);
    }

    private function userSummary(User $u): array
    {
        return [
            'id'        => $u->id,
            'name'      => $u->name,
            'avatarUrl' => $u->avatar_url,
            'online'    => $u->last_seen_at !== null
                && $u->last_seen_at->gt(now()->subSeconds(self::ONLINE_WINDOW)),
        ];
    }
}
