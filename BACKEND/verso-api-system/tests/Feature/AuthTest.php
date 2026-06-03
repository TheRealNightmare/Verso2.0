<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_avatar(): void
    {
        $res = $this->postJson('/api/register', [
            'name'     => 'Jane Reader',
            'email'    => 'jane@example.com',
            'password' => 'password123',
            'avatar'   => $this->fakeImage(),
            'role'     => 'user',
        ]);

        $res->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role', 'avatarUrl']]);
        $this->assertDatabaseHas('users', ['email' => 'jane@example.com', 'role' => null]);
    }

    public function test_registering_as_author_sets_author_role(): void
    {
        $res = $this->postJson('/api/register', [
            'name'     => 'Anna Author',
            'email'    => 'anna@example.com',
            'password' => 'password123',
            'avatar'   => $this->fakeImage(),
            'role'     => 'author',
            'bio'      => 'I write books.',
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('users', ['email' => 'anna@example.com', 'role' => 'author', 'bio' => 'I write books.']);
    }

    public function test_register_requires_avatar_and_valid_fields(): void
    {
        $this->postJson('/api/register', [
            'name'     => '',
            'email'    => 'not-an-email',
            'password' => 'short',
            'role'     => 'invalid',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['name', 'email', 'password', 'avatar', 'role']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dup@example.com']);

        $this->postJson('/api/register', [
            'name'     => 'Dup',
            'email'    => 'dup@example.com',
            'password' => 'password123',
            'avatar'   => $this->fakeImage(),
            'role'     => 'user',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_correct_credentials(): void
    {
        User::factory()->create(['email' => 'log@example.com']); // factory password = "password"

        $this->postJson('/api/login', ['email' => 'log@example.com', 'password' => 'password'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email']]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'log@example.com']);

        $this->postJson('/api/login', ['email' => 'log@example.com', 'password' => 'wrong'])
            ->assertStatus(401);
    }

    public function test_logout_revokes_token(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/logout')->assertOk();
    }

    public function test_logout_requires_authentication(): void
    {
        $this->postJson('/api/logout')->assertStatus(401);
    }
}
