<?php

namespace Database\Factories;

use App\Models\CommunityMessage;
use App\Models\CommunityReaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommunityReaction>
 */
class CommunityReactionFactory extends Factory
{
    protected $model = CommunityReaction::class;

    public function definition(): array
    {
        return [
            'message_id' => CommunityMessage::factory(),
            'user_id'    => User::factory(),
            'emoji'      => fake()->randomElement(['👍', '❤️', '😂', '😮', '😢', '😡']),
        ];
    }
}
