<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use App\Models\ReadingHistory;
use App\Models\ReadingSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $uid = $user->id;
        $range = $request->query('range', 'monthly');

        // Stats
        $stats = [
            'totalBooks' => Book::count(),
            'completed'  => ReadingHistory::where('user_id', $uid)->where('progress', 100)->count(),
            'quizScore'  => (int) round(QuizAttempt::where('user_id', $uid)->avg('score') ?? 0),
            'lessons'    => LessonCompletion::where('user_id', $uid)->count(),
        ];

        // Hours spent — last 5 months
        $hoursSpent = [];
        $monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        for ($i = 4; $i >= 0; $i--) {
            $start = Carbon::now()->startOfMonth()->subMonths($i);
            $end   = (clone $start)->endOfMonth();
            $minutes = (int) ReadingSession::where('user_id', $uid)
                ->whereBetween('started_at', [$start, $end])
                ->sum('duration_minutes');
            $hoursSpent[] = [
                'month' => $monthsShort[$start->month - 1],
                'hours' => (int) round($minutes / 60),
            ];
        }

        // Performance — points within range
        [$rangeStart, $rangeEnd] = $this->rangeBounds($range);
        $pointsInRange = (int) ReadingSession::where('user_id', $uid)
            ->whereBetween('started_at', [$rangeStart, $rangeEnd])
            ->sum('duration_minutes');
        $rawPoint = $pointsInRange / 10; // 10 minutes = 1 point
        $performance = [
            'point' => round(min($rawPoint, 10), 3),
            'max'   => 10,
        ];

        // Worm — avg progress on in-progress books
        $worm = [
            'value' => (int) round(ReadingHistory::where('user_id', $uid)
                ->where('progress', '<', 100)
                ->avg('progress') ?? 0),
            'max' => 100,
        ];

        // Leaderboard — top 10 by points
        $topUsers = User::orderByDesc('points')->limit(10)->get();
        $thisWeekStart = Carbon::now()->startOfWeek();
        $lastWeekStart = (clone $thisWeekStart)->subWeek();
        $lastWeekEnd = (clone $thisWeekStart)->subSecond();

        $leaderboard = $topUsers->values()->map(function ($u, $i) use ($thisWeekStart, $lastWeekStart, $lastWeekEnd) {
            $thisWeekMin = (int) ReadingSession::where('user_id', $u->id)
                ->where('started_at', '>=', $thisWeekStart)
                ->sum('duration_minutes');
            $lastWeekMin = (int) ReadingSession::where('user_id', $u->id)
                ->whereBetween('started_at', [$lastWeekStart, $lastWeekEnd])
                ->sum('duration_minutes');
            $totalMin = (int) ReadingSession::where('user_id', $u->id)->sum('duration_minutes');
            $courseCount = LessonCompletion::where('user_id', $u->id)->count();

            return [
                'id'     => $u->id,
                'rank'   => $i + 1,
                'name'   => $u->name,
                'avatar' => $u->avatar_url ?: 'https://i.pravatar.cc/150?u=' . $u->id,
                'course' => $courseCount,
                'hour'   => (int) round($totalMin / 60),
                'point'  => round(($u->points ?? 0) / 1000, 3),
                'trend'  => $thisWeekMin >= $lastWeekMin ? 'up' : 'down',
            ];
        });

        // Profile
        $profile = [
            'name'      => $user->name,
            'role'      => $user->role ?: 'Reader',
            'avatarUrl' => $user->avatar_url ?: 'https://i.pravatar.cc/150?u=' . $user->id,
            'email'     => $user->email,
        ];

        // Calendar marks — current month
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd   = Carbon::now()->endOfMonth();
        $calendarMarks = ReadingSession::where('user_id', $uid)
            ->whereBetween('started_at', [$monthStart, $monthEnd])
            ->selectRaw('DATE(started_at) as d')
            ->groupBy('d')
            ->pluck('d')
            ->toArray();

        // Todos
        $todos = \App\Models\Todo::where('user_id', $uid)
            ->orderBy('position')
            ->orderBy('id')
            ->get(['id', 'title', 'subtitle', 'time', 'done']);

        return response()->json([
            'stats'         => $stats,
            'hoursSpent'    => $hoursSpent,
            'performance'   => $performance,
            'worm'          => $worm,
            'leaderboard'   => $leaderboard,
            'profile'       => $profile,
            'calendarMarks' => $calendarMarks,
            'todos'         => $todos,
        ]);
    }

    private function rangeBounds(string $range): array
    {
        $now = Carbon::now();
        return match ($range) {
            'weekly' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'yearly' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            default  => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
        };
    }
}
