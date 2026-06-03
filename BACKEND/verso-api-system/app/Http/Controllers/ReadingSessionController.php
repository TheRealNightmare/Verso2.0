<?php

namespace App\Http\Controllers;

use App\Models\ReadingSession;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadingSessionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id'        => ['nullable', 'integer', 'exists:books,id'],
            'user_upload_id' => ['nullable', 'integer', 'exists:user_uploads,id'],
        ]);

        $session = ReadingSession::create([
            'user_id'        => $request->user()->id,
            'book_id'        => $validated['book_id'] ?? null,
            'user_upload_id' => $validated['user_upload_id'] ?? null,
            'started_at'     => now(),
            'duration_minutes' => 0,
        ]);

        return response()->json($session, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $session = ReadingSession::where('user_id', $request->user()->id)->findOrFail($id);

        $endedAt = now();
        // Carbon 3 diffs are signed: start -> end gives a positive elapsed value.
        $duration = max(0, (int) round(Carbon::parse($session->started_at)->diffInMinutes($endedAt)));

        $session->update([
            'ended_at' => $endedAt,
            'duration_minutes' => $duration,
        ]);

        // Award points: 1 point per 10 minutes (stored as integer hundredths => points scale)
        $user = $request->user();
        $user->points = ($user->points ?? 0) + $duration;
        $user->save();

        // Minutes/points just changed — refresh this user's dashboard + leaderboard.
        DashboardController::forgetUser($user->id);

        return response()->json($session);
    }
}
