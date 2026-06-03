<?php

namespace Database\Factories;

use App\Models\Annotation;
use App\Models\Book;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Annotation>
 */
class AnnotationFactory extends Factory
{
    protected $model = Annotation::class;

    public function definition(): array
    {
        return [
            'user_id'       => User::factory(),
            'book_id'       => Book::factory(),
            'page_index'    => fake()->numberBetween(0, 50),
            'column'        => fake()->randomElement(['left', 'right']),
            'start_offset'  => 0,
            'end_offset'    => 20,
            'selected_text' => fake()->sentence(),
            'note'          => fake()->sentence(),
            'color'         => '#ffeb3b',
        ];
    }
}
