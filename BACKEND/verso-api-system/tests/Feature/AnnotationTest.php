<?php

namespace Tests\Feature;

use App\Models\Annotation;
use App\Models\Book;
use App\Models\User;
use App\Models\UserUpload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnnotationTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $book = Book::factory()->create();
        $this->getJson("/api/books/{$book->id}/annotations")->assertStatus(401);
    }

    public function test_index_returns_only_own_book_annotations(): void
    {
        $me = User::factory()->create();
        $book = Book::factory()->create();
        Annotation::factory()->count(2)->create(['user_id' => $me->id, 'book_id' => $book->id]);
        Annotation::factory()->create(['book_id' => $book->id]); // other user
        Sanctum::actingAs($me);

        $res = $this->getJson("/api/books/{$book->id}/annotations")->assertOk();
        $this->assertCount(2, $res->json());
    }

    public function test_store_creates_annotation(): void
    {
        $me = User::factory()->create();
        $book = Book::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/books/{$book->id}/annotations", [
            'page_index'    => 1,
            'column'        => 'left',
            'start_offset'  => 0,
            'end_offset'    => 10,
            'selected_text' => 'hello world',
            'color'         => '#ff0000',
        ])->assertCreated();

        $this->assertDatabaseHas('annotations', [
            'user_id' => $me->id, 'book_id' => $book->id, 'selected_text' => 'hello world',
        ]);
    }

    public function test_store_validation_errors(): void
    {
        $book = Book::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/books/{$book->id}/annotations", ['column' => 'middle'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['page_index', 'column', 'start_offset', 'end_offset', 'selected_text']);
    }

    public function test_update_own_annotation_note(): void
    {
        $me = User::factory()->create();
        $a = Annotation::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->patchJson("/api/annotations/{$a->id}", ['note' => 'updated'])
            ->assertOk()->assertJsonPath('note', 'updated');
    }

    public function test_cannot_update_others_annotation(): void
    {
        $a = Annotation::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/annotations/{$a->id}", ['note' => 'x'])->assertNotFound();
    }

    public function test_destroy_own_annotation(): void
    {
        $me = User::factory()->create();
        $a = Annotation::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->deleteJson("/api/annotations/{$a->id}")->assertOk();
        $this->assertDatabaseMissing('annotations', ['id' => $a->id]);
    }

    public function test_upload_annotation_flow(): void
    {
        $me = User::factory()->create();
        $upload = UserUpload::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->postJson("/api/uploads/{$upload->id}/annotations", [
            'selected_text' => 'note me',
            'location'      => ['page' => 3, 'offset' => 12],
        ])->assertCreated();

        $this->getJson("/api/uploads/{$upload->id}/annotations")
            ->assertOk()->assertJsonCount(1);
    }

    public function test_cannot_annotate_another_users_upload(): void
    {
        $upload = UserUpload::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/uploads/{$upload->id}/annotations", [
            'selected_text' => 'x', 'location' => ['p' => 1],
        ])->assertNotFound();
    }
}
