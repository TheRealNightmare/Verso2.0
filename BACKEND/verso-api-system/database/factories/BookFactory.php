<?php

namespace Database\Factories;

use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    protected $model = Book::class;

    public function definition(): array
    {
        return [
            'title'           => fake()->sentence(3),
            'author'          => fake()->name(),
            'description'     => fake()->paragraph(),
            'cover_image_url' => fake()->imageUrl(),
            'genre'           => fake()->randomElement(['Fiction', 'Mystery', 'Sci-Fi', 'Romance', 'History']),
            'average_rating'  => fake()->randomFloat(1, 0, 5),
            'published_year'  => fake()->numberBetween(1900, 2026),
            'is_exclusive'    => false,
            'source'          => 'library',
        ];
    }

    public function exclusive(): static
    {
        return $this->state(fn () => ['is_exclusive' => true]);
    }
}
