<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_requires_auth(): void
    {
        $this->getJson('/api/users/search?q=ab')->assertStatus(401);
    }

    public function test_search_needs_two_characters(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/users/search?q=a')
            ->assertOk()->assertJson(['data' => []]);
    }

    public function test_search_finds_users_by_name_excluding_self(): void
    {
        $me = User::factory()->create(['name' => 'Zelda Searcher']);
        User::factory()->create(['name' => 'Findable Fox']);
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/users/search?q=Findable')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('Findable Fox', $res->json('data.0.name'));
    }

    public function test_public_profile_returns_stats(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['name' => 'Profiled']);
        Sanctum::actingAs($me);

        $this->getJson("/api/users/{$other->id}")
            ->assertOk()
            ->assertJsonPath('name', 'Profiled')
            ->assertJsonPath('isSelf', false)
            ->assertJsonStructure(['id', 'name', 'stats' => ['booksCompleted', 'favorites', 'reviews', 'hoursRead'], 'friendStatus']);
    }

    public function test_own_profile_is_self(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);
        $this->getJson("/api/users/{$me->id}")->assertOk()->assertJsonPath('isSelf', true);
    }
}
