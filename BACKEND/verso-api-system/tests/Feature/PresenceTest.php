<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PresenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->postJson('/api/presence/ping')->assertStatus(401);
    }

    public function test_ping_updates_last_seen_at(): void
    {
        $me = User::factory()->create(['last_seen_at' => null]);
        Sanctum::actingAs($me);

        $this->postJson('/api/presence/ping')
            ->assertOk()->assertJsonStructure(['lastSeenAt']);

        $this->assertNotNull($me->fresh()->last_seen_at);
    }
}
