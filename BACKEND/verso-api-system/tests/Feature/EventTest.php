<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title'     => 'Book Night',
            'date'      => now()->addWeek()->format('Y-m-d'),
            'time_from' => '18:00',
            'time_to'   => '20:00',
            'category'  => 'movie',
            'host'      => 'Library',
            'location'  => 'Main Hall',
        ], $overrides);
    }

    public function test_requires_auth(): void
    {
        $this->getJson('/api/events')->assertStatus(401);
    }

    public function test_index_lists_events(): void
    {
        Event::factory()->count(2)->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/events')->assertOk()->assertJsonCount(2);
    }

    public function test_store_creates_event(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/events', $this->payload())
            ->assertCreated()->assertJsonPath('title', 'Book Night');

        $this->assertDatabaseHas('events', ['user_id' => $me->id, 'title' => 'Book Night']);
    }

    public function test_store_with_cover_image(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->post('/api/events', $this->payload(['cover_image' => $this->fakeImage()]))
            ->assertCreated();
    }

    public function test_store_validation(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/events', ['category' => 'invalid', 'time_from' => '20:00', 'time_to' => '18:00'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'date', 'category', 'host', 'location', 'time_to']);
    }

    public function test_show_returns_event(): void
    {
        $event = Event::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/events/{$event->id}")->assertOk()->assertJsonPath('id', $event->id);
    }

    public function test_update_own_event(): void
    {
        $me = User::factory()->create();
        $event = Event::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->postJson("/api/events/{$event->id}", ['title' => 'Renamed'])
            ->assertOk()->assertJsonPath('title', 'Renamed');
    }

    public function test_cannot_update_others_event(): void
    {
        $event = Event::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/events/{$event->id}", ['title' => 'Hacked'])->assertNotFound();
    }

    public function test_destroy_own_event(): void
    {
        $me = User::factory()->create();
        $event = Event::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->deleteJson("/api/events/{$event->id}")->assertOk();
        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }
}
