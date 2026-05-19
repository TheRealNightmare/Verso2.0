<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('community', function ($user) {
    return (bool) $user;
});
