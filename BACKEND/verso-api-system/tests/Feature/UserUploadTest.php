<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserUpload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserUploadTest extends TestCase
{
    use RefreshDatabase;

    private function hash(): string
    {
        return hash('sha256', uniqid('', true));
    }

    public function test_requires_auth(): void
    {
        $this->getJson('/api/uploads')->assertStatus(401);
    }

    public function test_index_lists_only_own_uploads(): void
    {
        $me = User::factory()->create();
        UserUpload::factory()->count(2)->create(['user_id' => $me->id]);
        UserUpload::factory()->create();
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/uploads')->assertOk();
        $this->assertCount(2, $res->json());
    }

    public function test_store_creates_upload(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/uploads', [
            'title'     => 'My Book',
            'format'    => 'pdf',
            'file_hash' => $this->hash(),
            'file_size' => 12345,
        ])->assertCreated();

        $this->assertDatabaseHas('user_uploads', ['user_id' => $me->id, 'title' => 'My Book']);
    }

    public function test_store_dedupes_by_hash_returns_200(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);
        $hash = $this->hash();

        $this->postJson('/api/uploads', ['title' => 'A', 'format' => 'pdf', 'file_hash' => $hash, 'file_size' => 10])
            ->assertCreated();
        $this->postJson('/api/uploads', ['title' => 'A', 'format' => 'pdf', 'file_hash' => $hash, 'file_size' => 10])
            ->assertOk();

        $this->assertDatabaseCount('user_uploads', 1);
    }

    public function test_store_validates_hash_length_and_format(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/uploads', [
            'title' => 'X', 'format' => 'docx', 'file_hash' => 'short', 'file_size' => 1,
        ])->assertStatus(422)->assertJsonValidationErrors(['format', 'file_hash']);
    }

    public function test_destroy_only_own_upload(): void
    {
        $upload = UserUpload::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/uploads/{$upload->id}")->assertNotFound();
        $this->assertDatabaseHas('user_uploads', ['id' => $upload->id]);
    }
}
