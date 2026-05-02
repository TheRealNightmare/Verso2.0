<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding fake users and reviews...');

        $fakeUsers = User::factory(10)->create();

        $comments = [
            'A timeless masterpiece that never gets old.',
            'Absolutely captivating from start to finish.',
            'One of the best books I have ever read.',
            'The writing style is beautiful and engaging.',
            'A must-read for anyone who loves literature.',
            'Thought-provoking and deeply moving.',
            'Could not put it down once I started.',
            'A brilliant exploration of the human condition.',
            'The characters are so vivid and real.',
            'An unforgettable journey through words.',
            'Highly recommended to all book lovers.',
            'A classic that deserves every bit of praise.',
            'Wonderfully written with a gripping plot.',
            'Emotionally resonant and intellectually stimulating.',
            'Perfect for a long, cozy reading session.',
        ];

        $books = Book::all();

        foreach ($books as $book) {
            $reviewCount = rand(3, 6);
            $users       = $fakeUsers->random($reviewCount);
            $ratingSum   = 0;

            foreach ($users as $user) {
                $rating = rand(3, 5);
                $ratingSum += $rating;

                Review::create([
                    'user_id' => $user->id,
                    'book_id' => $book->id,
                    'rating'  => $rating,
                    'comment' => $comments[array_rand($comments)],
                ]);
            }

            $book->update(['average_rating' => round($ratingSum / $reviewCount, 1)]);
        }

        $this->command->info('ReviewSeeder complete.');
    }
}
