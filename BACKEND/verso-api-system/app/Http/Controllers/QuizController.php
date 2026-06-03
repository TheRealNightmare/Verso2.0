<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\ReadingHistory;
use App\Services\GeminiService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function __construct(private GeminiService $gemini)
    {
    }

    /**
     * GET /quizzes/available
     * Completed books that have readable content, with the user's best attempt (if any).
     */
    public function available(Request $request): JsonResponse
    {
        $uid = $request->user()->id;

        $completedBookIds = ReadingHistory::where('user_id', $uid)
            ->where('progress', 100)
            ->whereNotNull('book_id')
            ->pluck('book_id');

        if ($completedBookIds->isEmpty()) {
            return response()->json(['quizzes' => []]);
        }

        // Only books that actually have stored content are quiz-eligible (silent skip otherwise).
        $books = Book::with('content')
            ->whereIn('id', $completedBookIds)
            ->get()
            ->filter(fn (Book $b) => $this->hasContent($b))
            ->values();

        $quizzes = Quiz::whereIn('book_id', $books->pluck('id'))->get()->keyBy('book_id');
        $attempts = QuizAttempt::where('user_id', $uid)
            ->whereIn('quiz_id', $quizzes->pluck('id'))
            ->get()
            ->keyBy('quiz_id');

        $items = $books->map(function (Book $b) use ($quizzes, $attempts) {
            $quiz = $quizzes->get($b->id);
            $attempt = $quiz ? $attempts->get($quiz->id) : null;

            return [
                'book_id'         => $b->id,
                'title'           => $b->title,
                'cover_image_url' => $b->cover_image_url,
                'attempted'       => (bool) $attempt,
                'bestScore'       => $attempt ? (int) $attempt->score : null,
            ];
        })->all();

        return response()->json(['quizzes' => $items]);
    }

    /**
     * POST /quizzes/generate { book_id }
     * Build (or reuse) the book's quiz and return it without the answer keys.
     */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'book_id' => ['required', 'integer', 'exists:books,id'],
        ]);
        $uid = $request->user()->id;

        $completed = ReadingHistory::where('user_id', $uid)
            ->where('book_id', $data['book_id'])
            ->where('progress', 100)
            ->exists();
        if (! $completed) {
            return response()->json(['message' => 'Finish the book before taking its quiz.'], 422);
        }

        $book = Book::with('content')->findOrFail($data['book_id']);
        if (! $this->hasContent($book)) {
            return response()->json(['message' => 'This book has no readable content for a quiz.'], 422);
        }

        $quiz = Quiz::firstOrCreate(
            ['book_id' => $book->id],
            ['title' => $book->title.' — Quiz', 'max_score' => 100],
        );

        if (empty($quiz->questions)) {
            $questions = $this->gemini->generateBookQuiz($book->title, $book->author, $this->sourceText($book));
            if (! $questions) {
                return response()->json(['message' => "Couldn't build a quiz right now. Please try again."], 503);
            }
            $quiz->questions = $questions;
            $quiz->save();
        }

        return response()->json([
            'quiz_id'   => $quiz->id,
            'title'     => $quiz->title,
            'questions' => collect($quiz->questions)->map(fn ($q) => [
                'question' => $q['question'],
                'options'  => $q['options'],
            ])->values()->all(),
        ]);
    }

    /**
     * POST /quizzes/{quiz}/attempt { answers: int[] }
     * Grade the attempt and keep the best score across retakes.
     */
    public function attempt(Request $request, Quiz $quiz): JsonResponse
    {
        $questions = $quiz->questions ?? [];
        $count = count($questions);
        if ($count === 0) {
            return response()->json(['message' => 'Quiz is not ready yet.'], 422);
        }

        $data = $request->validate([
            'answers'   => ['required', 'array', 'size:'.$count],
            'answers.*' => ['nullable', 'integer'],
        ]);

        $uid = $request->user()->id;
        $perQuestion = (int) round($quiz->max_score / $count);

        $correct = 0;
        foreach ($questions as $i => $q) {
            if ((int) ($data['answers'][$i] ?? -1) === (int) $q['answer']) {
                $correct++;
            }
        }
        $score = $correct * $perQuestion;

        // Unique (user_id, quiz_id): keep the highest score the user has achieved.
        $attempt = QuizAttempt::firstOrNew(['user_id' => $uid, 'quiz_id' => $quiz->id]);
        if (! $attempt->exists || $score > (int) $attempt->score) {
            $attempt->score = $score;
        }
        $attempt->attempted_at = Carbon::now();
        $attempt->save();

        // Quiz score / attempt count changed — refresh dashboard + leaderboard.
        DashboardController::forgetUser($uid);

        return response()->json([
            'score'     => $score,
            'bestScore' => (int) $attempt->score,
            'correct'   => $correct,
            'total'     => $count,
            'max'       => (int) $quiz->max_score,
        ]);
    }

    private function hasContent(Book $book): bool
    {
        $c = $book->content;
        if (! $c) {
            return false;
        }
        if (is_array($c->chapters) && count($c->chapters) > 0) {
            return true;
        }

        return is_string($c->content) && trim($c->content) !== '';
    }

    private function sourceText(Book $book): string
    {
        $c = $book->content;
        if ($c && is_string($c->content) && trim($c->content) !== '') {
            return $c->content;
        }
        if ($c && is_array($c->chapters)) {
            return (string) json_encode($c->chapters);
        }

        return '';
    }
}
