<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->getJson('/api/profile')->assertStatus(401);
    }

    public function test_show_returns_shaped_profile(): void
    {
        $me = User::factory()->create(['name' => 'Me', 'banner_color' => '#123456']);
        Sanctum::actingAs($me);

        $this->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('name', 'Me')
            ->assertJsonStructure(['id', 'name', 'email', 'role', 'avatarUrl', 'bannerColor', 'points']);
    }

    public function test_update_basic_fields(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->patchJson('/api/profile', ['name' => 'New Name', 'bio' => 'hi', 'banner_color' => '#abcdef'])
            ->assertOk()->assertJsonPath('name', 'New Name');

        $this->assertDatabaseHas('users', ['id' => $me->id, 'name' => 'New Name', 'banner_color' => '#abcdef']);
    }

    public function test_banner_color_must_be_hex(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->patchJson('/api/profile', ['banner_color' => 'red'])
            ->assertStatus(422)->assertJsonValidationErrors(['banner_color']);
    }

    public function test_password_change_requires_correct_current_password(): void
    {
        $me = User::factory()->create(); // password = "password"
        Sanctum::actingAs($me);

        $this->patchJson('/api/profile', [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
            'current_password' => 'wrong',
        ])->assertStatus(422)->assertJsonValidationErrors(['current_password']);
    }

    public function test_password_change_succeeds_with_correct_current_password(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->patchJson('/api/profile', [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
            'current_password' => 'password',
        ])->assertOk();

        $this->assertTrue(Hash::check('newpassword123', $me->fresh()->password));
    }

    public function test_update_photo(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/profile/photo', ['photo' => $this->fakeImage()])
            ->assertOk()->assertJsonStructure(['avatarUrl']);
    }

    public function test_update_photo_requires_image(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/profile/photo', [])
            ->assertStatus(422)->assertJsonValidationErrors(['photo']);
    }
}
