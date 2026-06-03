<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\ReadingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReadingSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->postJson('/api/reading-sessions', [])->assertStatus(401);
    }

    public function test_store_starts_a_session(): void
    {
        $book = Book::factory()->create();
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/reading-sessions', ['book_id' => $book->id])
            ->assertCreated()->assertJsonPath('duration_minutes', 0);

        $this->assertDatabaseHas('reading_sessions', ['user_id' => $me->id, 'book_id' => $book->id]);
    }

    public function test_update_computes_duration_and_awards_points(): void
    {
        $me = User::factory()->create(['points' => 0]);
        $session = ReadingSession::factory()->create([
            'user_id'    => $me->id,
            'started_at' => now()->subMinutes(30),
            'ended_at'   => null,
        ]);
        Sanctum::actingAs($me);

        $this->patchJson("/api/reading-sessions/{$session->id}")
            ->assertOk()->assertJsonPath('duration_minutes', 30);

        // Controller adds duration_minutes to the user's points.
        $this->assertSame(30, (int) $me->fresh()->points);
    }

    public function test_cannot_update_another_users_session(): void
    {
        $session = ReadingSession::factory()->create(['started_at' => now()->subMinutes(5)]);
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/reading-sessions/{$session->id}")->assertNotFound();
    }
}
