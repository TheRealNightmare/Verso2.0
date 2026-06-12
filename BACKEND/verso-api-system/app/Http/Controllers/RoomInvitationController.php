<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RoomMembership;
use App\Models\RoomInvitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomInvitationController extends Controller
{
    use RoomMembership;

    /** My pending room invitations (for the notification bell). */
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();

        $pending = RoomInvitation::with(['room:id,name,type', 'inviter:id,name,avatar_url'])
            ->where('invitee_id', $me->id)
            ->where('status', 'pending')
            ->orderByDesc('id')
            ->get()
            // Drop stale invites whose room was deleted.
            ->filter(fn ($inv) => $inv->room !== null)
            ->values();

        return response()->json([
            'data'  => $pending->map(fn ($inv) => $this->shapeInvitation($inv)),
            'count' => $pending->count(),
        ]);
    }

    /** Accept an invitation: join the room and return the room. */
    public function accept(Request $request, int $id): JsonResponse
    {
        $me  = $request->user();
        $inv = RoomInvitation::findOrFail($id);

        if ($inv->invitee_id !== $me->id) {
            abort(403, 'This invitation is not yours.');
        }

        $room = $this->findRoom($inv->room_id);

        $inv->update(['status' => 'accepted']);

        return $this->addMember($room, $me->id);
    }

    /** Decline an invitation. */
    public function decline(Request $request, int $id): JsonResponse
    {
        $me  = $request->user();
        $inv = RoomInvitation::findOrFail($id);

        if ($inv->invitee_id !== $me->id) {
            abort(403, 'This invitation is not yours.');
        }

        $inv->update(['status' => 'declined']);

        return response()->json(['message' => 'Invitation declined.']);
    }

    private function shapeInvitation(RoomInvitation $inv): array
    {
        return [
            'id'   => $inv->id,
            'room' => [
                'id'   => $inv->room->id,
                'name' => $inv->room->name,
                'type' => $inv->room->type,
            ],
            'from' => [
                'id'        => $inv->inviter?->id,
                'name'      => $inv->inviter?->name,
                'avatarUrl' => $inv->inviter?->avatar_url,
            ],
            'createdAt' => $inv->created_at->toIso8601String(),
        ];
    }
}
