<?php

namespace App\Http\Controllers\Concerns;

use App\Events\RoomBroadcast;
use App\Models\ReadingRoom;
use App\Models\ReadingRoomMember;
use Illuminate\Http\JsonResponse;

trait RoomMembership
{
    /**
     * A deterministic palette for per-member highlight colors. Larger than the
     * private reader's 4-color set so rooms with several members stay legible.
     */
    private const ROOM_COLORS = [
        '#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8',
        '#fdba74', '#a5b4fc', '#5eead4', '#fca5a5',
        '#d8b4fe', '#86efac', '#93c5fd', '#f9a8d4',
    ];

    protected function findRoom(int $roomId): ReadingRoom
    {
        return ReadingRoom::findOrFail($roomId);
    }

    /** Ensure the user belongs to the room, returning their membership row. */
    protected function requireMember(ReadingRoom $room, int $userId): ReadingRoomMember
    {
        $member = $room->memberFor($userId);
        if (! $member) {
            abort(403, 'You are not a member of this room.');
        }
        return $member;
    }

    /** Ensure the user owns the room. */
    protected function requireOwner(ReadingRoom $room, int $userId): void
    {
        if ($room->owner_id !== $userId) {
            abort(403, 'Only the room owner can do this.');
        }
    }

    /** Pick the next available highlight color for a joining member. */
    protected function nextHighlightColor(ReadingRoom $room): string
    {
        $used = $room->members()->pluck('highlight_color')->all();
        foreach (self::ROOM_COLORS as $color) {
            if (! in_array($color, $used, true)) {
                return $color;
            }
        }
        // Palette exhausted — cycle deterministically by member count.
        return self::ROOM_COLORS[$room->members()->count() % count(self::ROOM_COLORS)];
    }

    /**
     * Add a user to a room (idempotent). Returns the shaped room as JSON so
     * callers can hand it straight back to the client.
     */
    protected function addMember(ReadingRoom $room, int $userId): JsonResponse
    {
        $existing = $room->memberFor($userId);
        if ($existing) {
            $room->load('book:id,title,author,cover_image_url');
            return response()->json($this->shapeRoom($room, $userId));
        }

        ReadingRoomMember::create([
            'room_id'         => $room->id,
            'user_id'         => $userId,
            'role'            => 'member',
            'highlight_color' => $this->nextHighlightColor($room),
            'joined_at'       => now(),
        ]);
        $room->increment('member_count');

        $member = $room->memberFor($userId)->load('user:id,name,avatar_url');
        broadcast(new RoomBroadcast($room->id, 'member.joined', $this->shapeMember($member)));

        $room->load('book:id,title,author,cover_image_url');
        return response()->json($this->shapeRoom($room, $userId), 201);
    }

    protected function shapeMember(ReadingRoomMember $m): array
    {
        return [
            'userId'    => $m->user_id,
            'name'      => $m->user?->name,
            'avatarUrl' => $m->user?->avatar_url,
            'color'     => $m->highlight_color,
            'role'      => $m->role,
            'lastPage'  => $m->last_page,
        ];
    }

    protected function shapeRoom(ReadingRoom $room, int $userId): array
    {
        $isOwner  = $room->owner_id === $userId;
        $isMember = $room->isMember($userId);
        // Owners always see the code; chat rooms also expose it to any member so
        // anyone can share the invite link. Reading rooms stay owner-only.
        $showCode = $isOwner || ($room->type === 'chat' && $isMember);

        return [
            'id'          => $room->id,
            'bookId'      => $room->book_id,
            'type'        => $room->type,
            'name'        => $room->name,
            'description' => $room->description,
            'visibility'  => $room->visibility,
            'joinCode'    => $showCode ? $room->join_code : null,
            'memberCount' => $room->member_count,
            'isOwner'     => $isOwner,
            'isMember'    => $isMember,
            'book'        => $room->book ? [
                'id'       => $room->book->id,
                'title'    => $room->book->title,
                'author'   => $room->book->author,
                'coverUrl' => $room->book->cover_image_url,
            ] : null,
            'updatedAt'   => $room->updated_at?->toIso8601String(),
        ];
    }
}
