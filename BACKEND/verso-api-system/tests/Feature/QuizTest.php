<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookContent;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\ReadingHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuizTest extends TestCase
{
    use RefreshDatabase;

    private function completedBookWithContent(User $user): Book
    {
        $book = Book::factory()->create();
        BookContent::factory()->create(['book_id' => $book->id]);
        ReadingHistory::factory()->completed()->create(['user_id' => $user->id, 'book_id' => $book->id]);

        return $book;
    }

    public function test_available_requires_auth(): void
    {
        $this->getJson('/api/quizzes/available')->assertStatus(401);
    }

    public function test_available_lists_completed_books_with_content(): void
    {
        $me = User::factory()->create();
        $book = $this->completedBookWithContent($me);
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/quizzes/available')->assertOk();
        $this->assertSame($book->id, $res->json('quizzes.0.book_id'));
    }

    public function test_generate_rejects_unfinished_book(): void
    {
        $me = User::factory()->create();
        $book = Book::factory()->create();
        BookContent::factory()->create(['book_id' => $book->id]);
        Sanctum::actingAs($me);

        $this->postJson('/api/quizzes/generate', ['book_id' => $book->id])
            ->assertStatus(422);
    }

    public function test_generate_returns_existing_quiz_without_answers(): void
    {
        $me = User::factory()->create();
        $book = $this->completedBookWithContent($me);
        // Pre-seed a quiz so no AI generation is needed.
        $quiz = Quiz::factory()->create(['book_id' => $book->id]);
        Sanctum::actingAs($me);

        $res = $this->postJson('/api/quizzes/generate', ['book_id' => $book->id])
            ->assertOk()
            ->assertJsonStructure(['quiz_id', 'title', 'questions' => [['question', 'options']]]);

        // Answer keys must never be exposed to the client.
        $this->assertArrayNotHasKey('answer', $res->json('questions.0'));
    }

    public function test_attempt_scores_correct_answers(): void
    {
        $me = User::factory()->create();
        $quiz = Quiz::factory()->create(); // 5 questions, correct index always 0, max 100
        Sanctum::actingAs($me);

        $this->postJson("/api/quizzes/{$quiz->id}/attempt", ['answers' => [0, 0, 0, 0, 0]])
            ->assertOk()
            ->assertJsonPath('score', 100)
            ->assertJsonPath('correct', 5)
            ->assertJsonPath('total', 5);
    }

    public function test_attempt_partial_score(): void
    {
        $me = User::factory()->create();
        $quiz = Quiz::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/quizzes/{$quiz->id}/attempt", ['answers' => [0, 0, 1, 1, 1]])
            ->assertOk()->assertJsonPath('score', 40)->assertJsonPath('correct', 2);
    }

    public function test_attempt_keeps_best_score_and_is_unique(): void
    {
        $me = User::factory()->create();
        $quiz = Quiz::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/quizzes/{$quiz->id}/attempt", ['answers' => [0, 0, 0, 0, 0]]); // 100
        $this->postJson("/api/quizzes/{$quiz->id}/attempt", ['answers' => [1, 1, 1, 1, 1]]) // 0
            ->assertOk()->assertJsonPath('bestScore', 100);

        $this->assertDatabaseCount('quiz_attempts', 1);
    }

    public function test_attempt_validates_answer_count(): void
    {
        $me = User::factory()->create();
        $quiz = Quiz::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/quizzes/{$quiz->id}/attempt", ['answers' => [0, 0]])
            ->assertStatus(422)->assertJsonValidationErrors(['answers']);
    }

    public function test_attempt_on_empty_quiz_is_rejected(): void
    {
        $me = User::factory()->create();
        $quiz = Quiz::factory()->empty()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/quizzes/{$quiz->id}/attempt", ['answers' => []])
            ->assertStatus(422);
    }
}
