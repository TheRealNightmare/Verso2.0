<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_review_list_is_public(): void
    {
        $book = Book::factory()->create();
        Review::factory()->count(2)->create(['book_id' => $book->id]);

        $res = $this->getJson("/api/books/{$book->id}/reviews")->assertOk();
        $this->assertCount(2, $res->json());
    }

    public function test_storing_review_requires_auth(): void
    {
        $book = Book::factory()->create();
        $this->postJson("/api/books/{$book->id}/reviews", ['rating' => 5])->assertStatus(401);
    }

    public function test_user_can_post_review_and_average_updates(): void
    {
        $book = Book::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/books/{$book->id}/reviews", ['rating' => 4, 'comment' => 'Great'])
            ->assertCreated()
            ->assertJsonPath('rating', 4);

        $this->assertEquals(4.0, (float) $book->fresh()->average_rating);
    }

    public function test_review_is_unique_per_user_and_updates(): void
    {
        $book = Book::factory()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/books/{$book->id}/reviews", ['rating' => 2]);
        $this->postJson("/api/books/{$book->id}/reviews", ['rating' => 5]);

        $this->assertDatabaseCount('reviews', 1);
        $this->assertDatabaseHas('reviews', ['user_id' => $user->id, 'book_id' => $book->id, 'rating' => 5]);
    }

    public function test_rating_must_be_between_1_and_5(): void
    {
        $book = Book::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/books/{$book->id}/reviews", ['rating' => 9])
            ->assertStatus(422)->assertJsonValidationErrors(['rating']);
    }

    public function test_review_on_missing_book_returns_404(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/books/999/reviews', ['rating' => 3])->assertNotFound();
    }
}
