<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\ReadingHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReadingHistory>
 */
class ReadingHistoryFactory extends Factory
{
    protected $model = ReadingHistory::class;

    public function definition(): array
    {
        return [
            'user_id'      => User::factory(),
            'book_id'      => Book::factory(),
            'progress'     => fake()->numberBetween(0, 100),
            'current_page' => fake()->numberBetween(0, 300),
            'last_read_at' => now(),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => ['progress' => 100]);
    }

    public function inProgress(): static
    {
        return $this->state(fn () => ['progress' => fake()->numberBetween(1, 99)]);
    }
}
