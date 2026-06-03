<?php

namespace Database\Factories;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Friendship>
 */
class FriendshipFactory extends Factory
{
    protected $model = Friendship::class;

    public function definition(): array
    {
        return [
            'requester_id' => User::factory(),
            'addressee_id' => User::factory(),
            'status'       => 'pending',
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn () => ['status' => 'accepted']);
    }
}
