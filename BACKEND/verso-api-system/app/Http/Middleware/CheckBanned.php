<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBanned
{
    /**
     * Reject authenticated requests from banned users. Their tokens are also
     * revoked at ban time (in the Admin panel), but this guards any that linger.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isBanned()) {
            return response()->json([
                'message' => $user->ban_reason
                    ? 'Your account has been banned: '.$user->ban_reason
                    : 'Your account has been banned.',
            ], 403);
        }

        return $next($request);
    }
}
