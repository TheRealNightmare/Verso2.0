<?php

namespace Tests\Feature;

use App\Models\Todo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TodoTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->getJson('/api/todos')->assertStatus(401);
    }

    public function test_index_lists_own_todos_in_order(): void
    {
        $me = User::factory()->create();
        Todo::factory()->create(['user_id' => $me->id, 'position' => 2, 'title' => 'B']);
        Todo::factory()->create(['user_id' => $me->id, 'position' => 1, 'title' => 'A']);
        Todo::factory()->create(); // other user
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/todos')->assertOk();
        $this->assertCount(2, $res->json());
        $this->assertSame('A', $res->json('0.title'));
    }

    public function test_store_creates_todo_with_next_position(): void
    {
        $me = User::factory()->create();
        Todo::factory()->create(['user_id' => $me->id, 'position' => 5]);
        Sanctum::actingAs($me);

        $this->postJson('/api/todos', ['title' => 'New'])
            ->assertCreated()->assertJsonPath('position', 6);
    }

    public function test_store_requires_title(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/todos', [])->assertStatus(422)->assertJsonValidationErrors(['title']);
    }

    public function test_update_marks_done(): void
    {
        $me = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $me->id, 'done' => false]);
        Sanctum::actingAs($me);

        $this->patchJson("/api/todos/{$todo->id}", ['done' => true])
            ->assertOk()->assertJsonPath('done', true);
    }

    public function test_cannot_update_others_todo(): void
    {
        $todo = Todo::factory()->create();
        Sanctum::actingAs(User::factory()->create());
        $this->patchJson("/api/todos/{$todo->id}", ['done' => true])->assertNotFound();
    }

    public function test_destroy_own_todo(): void
    {
        $me = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->deleteJson("/api/todos/{$todo->id}")->assertOk();
        $this->assertDatabaseMissing('todos', ['id' => $todo->id]);
    }
}
