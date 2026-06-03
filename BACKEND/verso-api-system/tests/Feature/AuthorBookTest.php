<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorBookTest extends TestCase
{
    use RefreshDatabase;

    private function bookFile(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            'book.txt',
            "Chapter 1\nThe story begins here with plenty of words.\n\nChapter 2\nAnd it continues onward."
        );
    }

    private function payload(): array
    {
        return [
            'title'       => 'My Novel',
            'description' => 'A great story.',
            'genre'       => 'Fiction',
            'cover'       => $this->fakeImage('cover.jpg'),
            'format'      => 'txt',
            'file'        => $this->bookFile(),
        ];
    }

    public function test_requires_auth(): void
    {
        $this->postJson('/api/author/books', [])->assertStatus(401);
    }

    public function test_non_author_cannot_publish(): void
    {
        Sanctum::actingAs(User::factory()->create()); // role = null
        $this->post('/api/author/books', $this->payload())->assertStatus(403);
    }

    public function test_author_can_publish_a_book(): void
    {
        $author = User::factory()->author()->create();
        Sanctum::actingAs($author);

        $this->post('/api/author/books', $this->payload())
            ->assertCreated()->assertJsonPath('title', 'My Novel');

        $this->assertDatabaseHas('books', [
            'title' => 'My Novel', 'author_id' => $author->id, 'source' => 'author',
        ]);
        $book = Book::where('author_id', $author->id)->first();
        $this->assertDatabaseHas('book_contents', ['book_id' => $book->id]);
    }

    public function test_publish_validation_errors(): void
    {
        $author = User::factory()->author()->create();
        Sanctum::actingAs($author);

        $this->postJson('/api/author/books', ['format' => 'doc'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'description', 'genre', 'cover', 'format', 'file']);
    }

    public function test_author_can_update_own_book(): void
    {
        $author = User::factory()->author()->create();
        $book = Book::factory()->create(['author_id' => $author->id]);
        Sanctum::actingAs($author);

        $this->post("/api/author/books/{$book->id}", ['title' => 'Updated Title'])
            ->assertOk();
        $this->assertSame('Updated Title', $book->fresh()->title);
    }

    public function test_cannot_update_another_authors_book(): void
    {
        $book = Book::factory()->create(['author_id' => User::factory()->author()->create()->id]);
        Sanctum::actingAs(User::factory()->author()->create());

        $this->post("/api/author/books/{$book->id}", ['title' => 'Nope'])->assertNotFound();
    }

    public function test_author_can_delete_own_book(): void
    {
        $author = User::factory()->author()->create();
        $book = Book::factory()->create(['author_id' => $author->id]);
        Sanctum::actingAs($author);

        $this->deleteJson("/api/author/books/{$book->id}")->assertOk();
        $this->assertDatabaseMissing('books', ['id' => $book->id]);
    }
}
