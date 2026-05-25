<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('community', function ($user) {
    return (bool) $user;
});

// Per-user private channel for friend-request and direct-message notifications.
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
