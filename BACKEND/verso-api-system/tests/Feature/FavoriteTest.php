<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Favorite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FavoriteTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->getJson('/api/favorites')->assertStatus(401);
    }

    public function test_toggle_adds_then_removes_favorite(): void
    {
        $book = Book::factory()->create();
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/favorites/toggle', ['book_id' => $book->id])
            ->assertOk()->assertJson(['is_favorited' => true]);
        $this->assertDatabaseHas('favorites', ['user_id' => $me->id, 'book_id' => $book->id]);

        $this->postJson('/api/favorites/toggle', ['book_id' => $book->id])
            ->assertOk()->assertJson(['is_favorited' => false]);
        $this->assertDatabaseMissing('favorites', ['user_id' => $me->id, 'book_id' => $book->id]);
    }

    public function test_index_returns_favorite_books(): void
    {
        $me = User::factory()->create();
        $book = Book::factory()->create();
        Favorite::factory()->create(['user_id' => $me->id, 'book_id' => $book->id]);
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/favorites')->assertOk();
        $this->assertSame($book->id, $res->json('0.id'));
    }

    public function test_for_user_returns_their_public_favorites(): void
    {
        $other = User::factory()->create();
        $book = Book::factory()->create();
        Favorite::factory()->create(['user_id' => $other->id, 'book_id' => $book->id]);
        Sanctum::actingAs(User::factory()->create());

        $res = $this->getJson("/api/users/{$other->id}/favorites")->assertOk();
        $this->assertCount(1, $res->json());
    }

    public function test_toggle_validates_book(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/favorites/toggle', ['book_id' => 999])
            ->assertStatus(422)->assertJsonValidationErrors(['book_id']);
    }
}
