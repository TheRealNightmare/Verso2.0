<?php

namespace Database\Factories;

use App\Models\CommunityMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommunityMessage>
 */
class CommunityMessageFactory extends Factory
{
    protected $model = CommunityMessage::class;

    public function definition(): array
    {
        return [
            'user_id'    => User::factory(),
            'parent_id'  => null,
            'type'       => 'text',
            'body'       => fake()->sentence(),
            'is_spoiler' => false,
        ];
    }

    public function reply(CommunityMessage $parent): static
    {
        return $this->state(fn () => ['parent_id' => $parent->id]);
    }
}
