<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReaderPreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->getJson('/api/reading-preferences')->assertStatus(401);
    }

    public function test_show_returns_defaults_when_none_saved(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/reading-preferences')
            ->assertOk()
            ->assertJsonPath('fontScale', 1)
            ->assertJsonPath('theme', 'light')
            ->assertJsonPath('asmrVolume', 60)
            ->assertJsonStructure(['fontScale', 'theme', 'bgColor', 'textColor', 'asmrTrack', 'asmrVolume']);
    }

    public function test_update_persists_and_reads_back(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->patchJson('/api/reading-preferences', [
            'font_scale'  => 1.5,
            'theme'       => 'dark',
            'asmr_track'  => 'waterfall',
            'asmr_volume' => 80,
        ])
            ->assertOk()
            ->assertJsonPath('fontScale', 1.5)
            ->assertJsonPath('theme', 'dark')
            ->assertJsonPath('asmrTrack', 'waterfall')
            ->assertJsonPath('asmrVolume', 80);

        $this->assertDatabaseHas('reader_preferences', [
            'user_id'     => $me->id,
            'theme'       => 'dark',
            'asmr_track'  => 'waterfall',
            'asmr_volume' => 80,
        ]);

        // updateOrCreate should not create a second row.
        $this->patchJson('/api/reading-preferences', ['theme' => 'sepia'])
            ->assertOk()
            ->assertJsonPath('theme', 'sepia');

        $this->assertDatabaseCount('reader_preferences', 1);
    }

    public function test_custom_theme_accepts_hex_colors(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson('/api/reading-preferences', [
            'theme'      => 'custom',
            'bg_color'   => '#102030',
            'text_color' => '#fafafa',
        ])
            ->assertOk()
            ->assertJsonPath('bgColor', '#102030')
            ->assertJsonPath('textColor', '#fafafa');
    }

    public function test_rejects_invalid_values(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson('/api/reading-preferences', ['font_scale' => 5])
            ->assertStatus(422);
        $this->patchJson('/api/reading-preferences', ['theme' => 'rainbow'])
            ->assertStatus(422);
        $this->patchJson('/api/reading-preferences', ['bg_color' => 'notacolor'])
            ->assertStatus(422);
    }
}
