<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(int $bookId): JsonResponse
    {
        $reviews = Review::with('user:id,name')
            ->where('book_id', $bookId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    public function store(Request $request, int $bookId): JsonResponse
    {
        Book::findOrFail($bookId);

        $validated = $request->validate([
            'rating'  => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $review = Review::updateOrCreate(
            ['user_id' => $request->user()->id, 'book_id' => $bookId],
            ['rating' => $validated['rating'], 'comment' => $validated['comment'] ?? null]
        );

        $avg = Review::where('book_id', $bookId)->avg('rating');
        Book::where('id', $bookId)->update(['average_rating' => round($avg, 1)]);

        return response()->json($review->load('user:id,name'), 201);
    }
}
