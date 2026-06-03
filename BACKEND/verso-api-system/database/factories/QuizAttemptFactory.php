<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizAttempt>
 */
class QuizAttemptFactory extends Factory
{
    protected $model = QuizAttempt::class;

    public function definition(): array
    {
        return [
            'user_id'      => User::factory(),
            'quiz_id'      => Quiz::factory(),
            'score'        => fake()->numberBetween(0, 100),
            'attempted_at' => now(),
        ];
    }
}
