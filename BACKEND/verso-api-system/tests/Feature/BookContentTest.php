<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_content_requires_authentication(): void
    {
        $book = Book::factory()->create();
        $this->getJson("/api/books/{$book->id}/content")->assertStatus(401);
    }

    public function test_authenticated_user_gets_book_chapters(): void
    {
        $book = Book::factory()->create();
        BookContent::factory()->create(['book_id' => $book->id]);

        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/books/{$book->id}/content")
            ->assertOk()
            ->assertJsonPath('book_id', $book->id)
            ->assertJsonStructure(['book_id', 'title', 'author', 'chapters']);
    }

    public function test_missing_book_returns_404(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/books/424242/content')->assertNotFound();
    }
}
