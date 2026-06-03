<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\ReadingHistory;
use App\Models\User;
use App\Models\UserUpload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_requires_auth(): void
    {
        $this->getJson('/api/history')->assertStatus(401);
    }

    public function test_index_lists_only_own_history(): void
    {
        $me = User::factory()->create();
        ReadingHistory::factory()->count(2)->create(['user_id' => $me->id]);
        ReadingHistory::factory()->create(); // someone else

        Sanctum::actingAs($me);

        $res = $this->getJson('/api/history')->assertOk();
        $this->assertCount(2, $res->json());
    }

    public function test_store_records_progress_for_a_book(): void
    {
        $book = Book::factory()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/history', ['book_id' => $book->id, 'progress' => 42])
            ->assertOk();

        $this->assertDatabaseHas('reading_histories', [
            'user_id' => $user->id, 'book_id' => $book->id, 'progress' => 42,
        ]);
    }

    public function test_store_is_idempotent_per_book(): void
    {
        $book = Book::factory()->create();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/history', ['book_id' => $book->id, 'progress' => 10]);
        $this->postJson('/api/history', ['book_id' => $book->id, 'progress' => 80]);

        $this->assertDatabaseCount('reading_histories', 1);
        $this->assertDatabaseHas('reading_histories', ['book_id' => $book->id, 'progress' => 80]);
    }

    public function test_store_requires_book_or_upload(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/history', ['progress' => 10])
            ->assertStatus(422)->assertJsonValidationErrors(['book_id', 'user_upload_id']);
    }

    public function test_progress_must_be_within_bounds(): void
    {
        $book = Book::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/history', ['book_id' => $book->id, 'progress' => 150])
            ->assertStatus(422)->assertJsonValidationErrors(['progress']);
    }

    public function test_cannot_record_history_for_another_users_upload(): void
    {
        $upload = UserUpload::factory()->create(); // owned by a different user
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/history', ['user_upload_id' => $upload->id, 'progress' => 10])
            ->assertStatus(422)->assertJsonValidationErrors(['user_upload_id']);
    }

    public function test_destroy_removes_own_entry(): void
    {
        $me = User::factory()->create();
        $entry = ReadingHistory::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->deleteJson("/api/history/{$entry->id}")->assertOk();
        $this->assertDatabaseMissing('reading_histories', ['id' => $entry->id]);
    }

    public function test_cannot_destroy_another_users_entry(): void
    {
        $entry = ReadingHistory::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/history/{$entry->id}")->assertNotFound();
        $this->assertDatabaseHas('reading_histories', ['id' => $entry->id]);
    }
}
