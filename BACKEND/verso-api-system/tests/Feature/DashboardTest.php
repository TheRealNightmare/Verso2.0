<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\ReadingHistory;
use App\Models\ReadingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->getJson('/api/dashboard/summary')->assertStatus(401);
    }

    public function test_summary_has_expected_shape(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonStructure([
                'stats'       => ['reading', 'completed', 'quizScore'],
                'hoursSpent', 'performance' => ['point', 'max'],
                'worm', 'calendarMarks', 'leaderboard', 'profile', 'todos',
            ]);
    }

    public function test_summary_counts_reading_and_completed(): void
    {
        $me = User::factory()->create();
        ReadingHistory::factory()->create(['user_id' => $me->id, 'progress' => 50]);
        ReadingHistory::factory()->create(['user_id' => $me->id, 'progress' => 100]);
        Sanctum::actingAs($me);

        $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('stats.reading', 1)
            ->assertJsonPath('stats.completed', 1);
    }

    public function test_leaderboard_lists_top_users(): void
    {
        $top = User::factory()->create(['points' => 5000, 'name' => 'Champ']);
        ReadingSession::factory()->create(['user_id' => $top->id, 'duration_minutes' => 600]);
        Sanctum::actingAs(User::factory()->create(['points' => 1]));

        $res = $this->getJson('/api/dashboard/summary')->assertOk();
        $this->assertSame('Champ', $res->json('leaderboard.0.name'));
        $this->assertSame(1, $res->json('leaderboard.0.rank'));
    }

    public function test_range_parameter_is_accepted(): void
    {
        Sanctum::actingAs(User::factory()->create());
        foreach (['weekly', 'monthly', 'yearly'] as $range) {
            $this->getJson("/api/dashboard/summary?range={$range}")->assertOk();
        }
    }
}
