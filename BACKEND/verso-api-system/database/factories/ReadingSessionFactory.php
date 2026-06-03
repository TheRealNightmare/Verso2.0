<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\ReadingSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReadingSession>
 */
class ReadingSessionFactory extends Factory
{
    protected $model = ReadingSession::class;

    public function definition(): array
    {
        return [
            'user_id'          => User::factory(),
            'book_id'          => Book::factory(),
            'started_at'       => now()->subMinutes(30),
            'ended_at'         => now(),
            'duration_minutes' => 30,
        ];
    }
}
