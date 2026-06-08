<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ReadingRoom;
use App\Models\ReadingRoomMember;

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
}
