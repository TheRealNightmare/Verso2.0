<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    public function ping(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->last_seen_at = now();
        $user->save();

        return response()->json([
            'lastSeenAt' => $user->last_seen_at->toIso8601String(),
        ]);
    }
}
