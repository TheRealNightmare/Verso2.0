<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReaderAssistantTest extends TestCase
{
    use RefreshDatabase;

    public function test_ask_requires_auth(): void
    {
        $this->postJson('/api/reader/ask-gemini', [
            'selected_text' => 'Some passage',
            'question'      => 'What does this mean?',
        ])->assertStatus(401);
    }

    public function test_ask_validates_required_fields(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/reader/ask-gemini', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['selected_text', 'question']);
    }

    public function test_ask_returns_503_when_disabled(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->mock(GeminiService::class, function ($mock) {
            $mock->shouldReceive('enabled')->andReturn(false);
        });

        $this->postJson('/api/reader/ask-gemini', [
            'selected_text' => 'Some passage',
            'question'      => 'What does this mean?',
        ])->assertStatus(503);
    }

    public function test_ask_returns_answer_on_success(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->mock(GeminiService::class, function ($mock) {
            $mock->shouldReceive('enabled')->andReturn(true);
            $mock->shouldReceive('answerAboutPassage')
                ->once()
                ->andReturn('It refers to the protagonist coming of age.');
        });

        $this->postJson('/api/reader/ask-gemini', [
            'selected_text' => 'A passage about growing up.',
            'question'      => 'What does this mean?',
            'book_title'    => 'Test Book',
        ])
            ->assertOk()
            ->assertJsonPath('answer', 'It refers to the protagonist coming of age.');
    }

    public function test_ask_returns_502_when_model_fails(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->mock(GeminiService::class, function ($mock) {
            $mock->shouldReceive('enabled')->andReturn(true);
            $mock->shouldReceive('answerAboutPassage')->once()->andReturn(null);
        });

        $this->postJson('/api/reader/ask-gemini', [
            'selected_text' => 'Some passage',
            'question'      => 'What does this mean?',
        ])->assertStatus(502);
    }
}
