<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\ReadingSession;
use App\Models\Todo;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DashboardSeeder extends Seeder
{
    public function run(): void
    {
        // Quizzes + lessons per book
        $books = Book::all();
        foreach ($books as $book) {
            Quiz::firstOrCreate(
                ['book_id' => $book->id, 'title' => $book->title . ' — Quiz'],
                ['max_score' => 100]
            );
            for ($i = 1; $i <= 3; $i++) {
                Lesson::firstOrCreate(
                    ['book_id' => $book->id, 'order' => $i],
                    ['title' => "Lesson {$i}: " . $book->title]
                );
            }
        }

        // Ensure we have at least 5 users
        $users = User::limit(5)->get();
        while ($users->count() < 5) {
            $n = $users->count() + 1;
            $u = User::factory()->create([
                'name'  => "Reader {$n}",
                'email' => "reader{$n}@example.com",
            ]);
            $users->push($u);
        }

        $quizzes = Quiz::all();
        $lessons = Lesson::all();

        foreach ($users as $user) {
            $user->role = $user->role ?: 'College Student';
            $user->avatar_url = $user->avatar_url ?: 'https://i.pravatar.cc/150?u=' . $user->id;
            $user->points = $user->points ?: rand(2000, 8000);
            $user->save();

            // Reading sessions: 5–10 over last 30 days
            $sessionCount = rand(5, 10);
            for ($i = 0; $i < $sessionCount; $i++) {
                $start = Carbon::now()->subDays(rand(0, 29))->subMinutes(rand(0, 600));
                $dur = rand(15, 90);
                ReadingSession::create([
                    'user_id'          => $user->id,
                    'book_id'          => $books->isNotEmpty() ? $books->random()->id : null,
                    'started_at'       => $start,
                    'ended_at'         => (clone $start)->addMinutes($dur),
                    'duration_minutes' => $dur,
                ]);
            }

            // Quiz attempts: a few random quizzes
            foreach ($quizzes->random(min(3, $quizzes->count())) as $q) {
                QuizAttempt::updateOrCreate(
                    ['user_id' => $user->id, 'quiz_id' => $q->id],
                    ['score' => rand(60, 100), 'attempted_at' => Carbon::now()->subDays(rand(0, 20))]
                );
            }

            // Lesson completions
            foreach ($lessons->random(min(5, $lessons->count())) as $l) {
                LessonCompletion::updateOrCreate(
                    ['user_id' => $user->id, 'lesson_id' => $l->id],
                    ['completed_at' => Carbon::now()->subDays(rand(0, 20))]
                );
            }

            // Todos
            $sampleTodos = [
                ['title' => 'Theory of Networking', 'subtitle' => 'Social Book', 'time' => '08:00 AM', 'done' => false],
                ['title' => 'Learn about data',     'subtitle' => null,           'time' => null,        'done' => false],
                ['title' => '30 min of peace',      'subtitle' => null,           'time' => null,        'done' => false],
                ['title' => 'Poetry Session',       'subtitle' => 'Art',          'time' => '02:40 PM', 'done' => false],
                ['title' => 'Learn to sell',        'subtitle' => 'Business',     'time' => '04:50 PM', 'done' => true],
            ];
            foreach ($sampleTodos as $idx => $t) {
                Todo::firstOrCreate(
                    ['user_id' => $user->id, 'title' => $t['title']],
                    array_merge($t, ['position' => $idx])
                );
            }
        }
    }
}
