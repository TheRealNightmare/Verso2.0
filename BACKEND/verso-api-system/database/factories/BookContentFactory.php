<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\BookContent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookContent>
 */
class BookContentFactory extends Factory
{
    protected $model = BookContent::class;

    public function definition(): array
    {
        return [
            'book_id'  => Book::factory(),
            'content'  => fake()->paragraphs(5, true),
            'chapters' => [
                ['title' => 'Chapter 1', 'content' => fake()->paragraph()],
                ['title' => 'Chapter 2', 'content' => fake()->paragraph()],
            ],
        ];
    }
}
