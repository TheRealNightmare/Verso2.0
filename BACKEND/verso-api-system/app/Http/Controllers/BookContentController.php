<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\JsonResponse;

class BookContentController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $book = Book::with('content')->findOrFail($id);

        return response()->json([
            'book_id' => $book->id,
            'title'   => $book->title,
            'author'  => $book->author,
            'content' => $book->content?->content ?? '',
        ]);
    }
}
