<?php

use App\Models\ReadingRoom;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('community', function ($user) {
    return (bool) $user;
});

// Per-user private channel for friend-request and direct-message notifications.
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Reading room private channel: shared highlights, comments, and chat. Members only.
Broadcast::channel('reading-room.{roomId}', function ($user, $roomId) {
    return ReadingRoom::find($roomId)?->isMember($user->id) ?? false;
});

// Reading room presence channel: who is currently in the room + soft location.
Broadcast::channel('presence-reading-room.{roomId}', function ($user, $roomId) {
    $room = ReadingRoom::find($roomId);
    if (! $room || ! $room->isMember($user->id)) {
        return false;
    }
    $member = $room->memberFor($user->id);

    return [
        'id'        => $user->id,
        'name'      => $user->name,
        'avatarUrl' => $user->avatar_url,
        'color'     => $member?->highlight_color,
        'lastPage'  => $member?->last_page ?? 0,
    ];
});
