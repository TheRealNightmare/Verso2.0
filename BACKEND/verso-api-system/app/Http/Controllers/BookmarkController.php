<?php

namespace App\Http\Controllers;

use App\Models\Bookmark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookmarks = Bookmark::with('book')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($bookmarks->pluck('book'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id' => ['required', 'integer', 'exists:books,id'],
        ]);

        $bookmark = Bookmark::firstOrCreate([
            'user_id' => $request->user()->id,
            'book_id' => $validated['book_id'],
        ]);

        return response()->json($bookmark, 201);
    }

    public function destroy(Request $request, int $bookId): JsonResponse
    {
        Bookmark::where('user_id', $request->user()->id)
            ->where('book_id', $bookId)
            ->delete();

        return response()->json(['message' => 'Bookmark removed.']);
    }
}
