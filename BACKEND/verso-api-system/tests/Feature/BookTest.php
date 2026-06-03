<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_returns_shelves(): void
    {
        Book::factory()->count(3)->create();

        $this->getJson('/api/books/home')
            ->assertOk()
            ->assertJsonStructure(['latest', 'recommended', 'exclusive', 'highly_rated', 'favorites']);
    }

    public function test_index_lists_and_paginates_books(): void
    {
        Book::factory()->count(5)->create();

        $this->getJson('/api/books')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'total']);
    }

    public function test_index_search_filters_by_title(): void
    {
        Book::factory()->create(['title' => 'The Hobbit']);
        Book::factory()->create(['title' => 'War and Peace']);

        $res = $this->getJson('/api/books?search=Hobbit')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('The Hobbit', $res->json('data.0.title'));
    }

    public function test_show_returns_book_with_reviews_count(): void
    {
        $book = Book::factory()->create();

        $this->getJson("/api/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('id', $book->id)
            ->assertJsonPath('reviews_count', 0);
    }

    public function test_show_returns_404_for_missing_book(): void
    {
        $this->getJson('/api/books/999999')->assertNotFound();
    }

    public function test_books_by_author_requires_auth(): void
    {
        $author = User::factory()->author()->create();
        Book::factory()->create(['author_id' => $author->id]);

        $this->getJson("/api/users/{$author->id}/books")->assertStatus(401);
    }

    public function test_books_by_author_returns_their_books(): void
    {
        $author = User::factory()->author()->create();
        Book::factory()->count(2)->create(['author_id' => $author->id]);
        Book::factory()->create(); // someone else's

        Sanctum::actingAs(User::factory()->create());

        $res = $this->getJson("/api/users/{$author->id}/books")->assertOk();
        $this->assertCount(2, $res->json());
    }

    public function test_my_uploads_returns_own_published_books(): void
    {
        $author = User::factory()->author()->create();
        Book::factory()->count(2)->create(['author_id' => $author->id]);

        Sanctum::actingAs($author);

        $res = $this->getJson('/api/me/books')->assertOk();
        $this->assertCount(2, $res->json());
    }
}
