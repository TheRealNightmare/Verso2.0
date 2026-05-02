<?php

namespace App\Http\Controllers;

use App\Models\ReadingHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $history = ReadingHistory::with('book')
            ->where('user_id', $request->user()->id)
            ->orderBy('last_read_at', 'desc')
            ->get();

        return response()->json($history);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id'  => ['required', 'integer', 'exists:books,id'],
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $history = ReadingHistory::updateOrCreate(
            ['user_id' => $request->user()->id, 'book_id' => $validated['book_id']],
            ['progress' => $validated['progress'], 'last_read_at' => now()]
        );

        return response()->json($history, 200);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $entry = ReadingHistory::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $entry->delete();

        return response()->json(['message' => 'Removed from history.']);
    }
}
