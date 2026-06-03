<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Bookmark;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookmarkTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->getJson('/api/bookmarks')->assertStatus(401);
    }

    public function test_index_returns_bookmarked_books(): void
    {
        $me = User::factory()->create();
        $book = Book::factory()->create();
        Bookmark::factory()->create(['user_id' => $me->id, 'book_id' => $book->id]);
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/bookmarks')->assertOk();
        $this->assertCount(1, $res->json());
        $this->assertSame($book->id, $res->json('0.id'));
    }

    public function test_store_creates_bookmark_once(): void
    {
        $book = Book::factory()->create();
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/bookmarks', ['book_id' => $book->id])->assertCreated();
        $this->postJson('/api/bookmarks', ['book_id' => $book->id])->assertCreated();

        $this->assertDatabaseCount('bookmarks', 1);
    }

    public function test_store_validates_book_exists(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/bookmarks', ['book_id' => 999])
            ->assertStatus(422)->assertJsonValidationErrors(['book_id']);
    }

    public function test_destroy_removes_bookmark(): void
    {
        $me = User::factory()->create();
        $book = Book::factory()->create();
        Bookmark::factory()->create(['user_id' => $me->id, 'book_id' => $book->id]);
        Sanctum::actingAs($me);

        $this->deleteJson("/api/bookmarks/{$book->id}")->assertOk();
        $this->assertDatabaseMissing('bookmarks', ['user_id' => $me->id, 'book_id' => $book->id]);
    }
}
