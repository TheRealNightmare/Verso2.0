<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MetaTest extends TestCase
{
    use RefreshDatabase;

    public function test_genders_are_public(): void
    {
        $this->getJson('/api/meta/genders')
            ->assertOk()
            ->assertJson(['Male', 'Female', 'Other', 'Prefer not to say']);
    }

    public function test_event_categories_are_public(): void
    {
        $this->getJson('/api/meta/event-categories')
            ->assertOk()
            ->assertJsonStructure(['movie' => ['key', 'label'], 'writer', 'play', 'genre']);
    }
}
