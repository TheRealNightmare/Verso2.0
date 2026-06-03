<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'user_id'     => User::factory(),
            'title'       => fake()->sentence(3),
            'subtitle'    => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'date'        => now()->addDays(7)->format('Y-m-d'),
            'time_from'   => '18:00',
            'time_to'     => '20:00',
            'category'    => fake()->randomElement(['movie', 'writer', 'play', 'genre']),
            'host'        => fake()->name(),
            'location'    => fake()->city(),
        ];
    }
}
