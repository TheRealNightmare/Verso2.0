<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quiz>
 */
class QuizFactory extends Factory
{
    protected $model = Quiz::class;

    public function definition(): array
    {
        return [
            'book_id'   => Book::factory(),
            'title'     => fake()->sentence(3).' — Quiz',
            'max_score' => 100,
            'questions' => $this->sampleQuestions(),
        ];
    }

    /** Five deterministic questions; correct answer index is always 0. */
    public function sampleQuestions(): array
    {
        $q = [];
        for ($i = 1; $i <= 5; $i++) {
            $q[] = [
                'question' => "Question $i?",
                'options'  => ['Correct', 'Wrong A', 'Wrong B', 'Wrong C'],
                'answer'   => 0,
            ];
        }

        return $q;
    }

    public function empty(): static
    {
        return $this->state(fn () => ['questions' => null]);
    }
}
