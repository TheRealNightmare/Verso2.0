<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class CommunityController extends Controller
{
    public function info(): JsonResponse
    {
        $memberCount = User::count();
        $onlineCount = User::where('last_seen_at', '>=', now()->subSeconds(60))->count();

        return response()->json([
            'name'        => config('app.community_name', 'Verso Community'),
            'description' => config('app.community_description', 'A place for readers to chat, share, and discover.'),
            'memberCount' => $memberCount,
            'onlineCount' => $onlineCount,
        ]);
    }
}
