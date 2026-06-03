<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Favorite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RecommendationTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->getJson('/api/recommendations/books')->assertStatus(401);
    }

    public function test_new_user_gets_cold_start_popular_books(): void
    {
        Book::factory()->count(5)->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/recommendations/books')
            ->assertOk()
            ->assertJsonPath('coldStart', true)
            ->assertJsonStructure(['books', 'coldStart']);
    }

    public function test_user_with_history_is_not_cold_start(): void
    {
        $me = User::factory()->create();
        Book::factory()->count(10)->create();
        Favorite::factory()->create(['user_id' => $me->id, 'book_id' => Book::factory()->create(['genre' => 'Sci-Fi'])->id]);
        Sanctum::actingAs($me);

        $this->getJson('/api/recommendations/books')
            ->assertOk()
            ->assertJsonPath('coldStart', false);
    }

    public function test_people_recommendations_exclude_self(): void
    {
        $me = User::factory()->create();
        User::factory()->count(3)->create();
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/recommendations/people')
            ->assertOk()->assertJsonStructure(['people']);

        $ids = collect($res->json('people'))->pluck('id');
        $this->assertNotContains($me->id, $ids);
    }
}
