<?php

namespace Database\Factories;

use App\Models\Todo;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Todo>
 */
class TodoFactory extends Factory
{
    protected $model = Todo::class;

    public function definition(): array
    {
        return [
            'user_id'  => User::factory(),
            'title'    => fake()->sentence(3),
            'subtitle' => fake()->sentence(4),
            'time'     => '09:00',
            'done'     => false,
            'position' => fake()->numberBetween(0, 10),
        ];
    }
}
