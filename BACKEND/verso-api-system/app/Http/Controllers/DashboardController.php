<?php

namespace App\Http\Controllers;

use App\Models\QuizAttempt;
use App\Models\ReadingHistory;
use App\Models\ReadingSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $uid = $user->id;
        $range = $request->query('range', 'monthly');

        // Per-user stats are expensive (many aggregate queries) but change slowly,
        // so cache them briefly per user+range. Mirrors the BookController::home
        // pattern. Profile and todos stay live below so edits show immediately.
        $userBlock = Cache::remember("dashboard:{$uid}:{$range}", 120, function () use ($uid, $range) {
            return $this->userBlock($uid, $range);
        });

        // The leaderboard is identical for everyone, so cache it under one global
        // key. The N+1 per-user loop is replaced with grouped aggregate queries.
        $leaderboard = Cache::remember('dashboard.leaderboard', 300, fn () => $this->leaderboard());

        // Live (cheap, must reflect edits immediately).
        $profile = [
            'name'      => $user->name,
            'role'      => $user->role ?: 'Reader',
            'avatarUrl' => $user->avatar_url ?: 'https://i.pravatar.cc/150?u=' . $user->id,
            'email'     => $user->email,
        ];

        $todos = \App\Models\Todo::where('user_id', $uid)
            ->orderBy('position')
            ->orderBy('id')
            ->get(['id', 'title', 'subtitle', 'time', 'done']);

        return response()->json($userBlock + [
            'leaderboard'   => $leaderboard,
            'profile'       => $profile,
            'todos'         => $todos,
        ]);
    }

    /**
     * Drop a user's cached dashboard blocks (all ranges) and the shared
     * leaderboard. Call after reading sessions / quiz attempts so freshly earned
     * progress shows up immediately instead of waiting out the TTL.
     */
    public static function forgetUser(int $uid): void
    {
        foreach (['monthly', 'weekly', 'yearly'] as $range) {
            Cache::forget("dashboard:{$uid}:{$range}");
        }
        Cache::forget('dashboard.leaderboard');
    }

    /** Per-user, cacheable portion of the dashboard. */
    private function userBlock(int $uid, string $range): array
    {
        // Stats — all scoped to the user so a new account starts at zero.
        $stats = [
            'reading'   => ReadingHistory::where('user_id', $uid)
                ->whereBetween('progress', [1, 99])->count(),
            'completed' => ReadingHistory::where('user_id', $uid)->where('progress', 100)->count(),
            'quizScore' => (int) (QuizAttempt::where('user_id', $uid)->sum('score') ?? 0),
        ];

        // Hours spent — last 5 months (5 cheap sums; kept as a loop to stay
        // portable across the sqlite/MySQL drivers this app runs on).
        $hoursSpent = [];
        $monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        for ($i = 4; $i >= 0; $i--) {
            $start = Carbon::now()->startOfMonth()->subMonths($i);
            $end   = (clone $start)->endOfMonth();
            $minutes = (int) ReadingSession::where('user_id', $uid)
                ->whereBetween('started_at', [$start, $end])
                ->sum('duration_minutes');
            $hoursSpent[] = [
                'month'   => $monthsShort[$start->month - 1],
                'minutes' => $minutes,
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

        // Calendar marks — current month
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd   = Carbon::now()->endOfMonth();
        $calendarMarks = ReadingSession::where('user_id', $uid)
            ->whereBetween('started_at', [$monthStart, $monthEnd])
            ->selectRaw('DATE(started_at) as d')
            ->groupBy('d')
            ->pluck('d')
            ->toArray();

        return [
            'stats'         => $stats,
            'hoursSpent'    => $hoursSpent,
            'performance'   => $performance,
            'worm'          => $worm,
            'calendarMarks' => $calendarMarks,
        ];
    }

    /** Top-10 leaderboard, computed with grouped aggregates (no N+1). */
    private function leaderboard(): array
    {
        $topUsers = User::orderByDesc('points')->limit(10)->get();
        $ids = $topUsers->pluck('id')->all();

        $thisWeekStart = Carbon::now()->startOfWeek();
        $lastWeekStart = (clone $thisWeekStart)->subWeek();
        $lastWeekEnd = (clone $thisWeekStart)->subSecond();

        // One query for total / this-week / last-week minutes across all top users.
        $minutes = ReadingSession::whereIn('user_id', $ids)
            ->selectRaw('user_id')
            ->selectRaw('SUM(duration_minutes) as total_min')
            ->selectRaw('SUM(CASE WHEN started_at >= ? THEN duration_minutes ELSE 0 END) as this_week_min', [$thisWeekStart])
            ->selectRaw('SUM(CASE WHEN started_at BETWEEN ? AND ? THEN duration_minutes ELSE 0 END) as last_week_min', [$lastWeekStart, $lastWeekEnd])
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        // One query for quiz counts.
        $quizCounts = QuizAttempt::whereIn('user_id', $ids)
            ->selectRaw('user_id, COUNT(*) as cnt')
            ->groupBy('user_id')
            ->pluck('cnt', 'user_id');

        return $topUsers->values()->map(function ($u, $i) use ($minutes, $quizCounts) {
            $m = $minutes->get($u->id);
            $thisWeekMin = (int) ($m->this_week_min ?? 0);
            $lastWeekMin = (int) ($m->last_week_min ?? 0);
            $totalMin    = (int) ($m->total_min ?? 0);

            return [
                'id'     => $u->id,
                'rank'   => $i + 1,
                'name'   => $u->name,
                'avatarUrl' => $u->avatar_url ?: 'https://i.pravatar.cc/150?u=' . $u->id,
                'course' => (int) ($quizCounts[$u->id] ?? 0),
                'hour'   => (int) round($totalMin / 60),
                'point'  => round(($u->points ?? 0) / 1000, 3),
                'trend'  => $thisWeekMin >= $lastWeekMin ? 'up' : 'down',
            ];
        })->all();
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
