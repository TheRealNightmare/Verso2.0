<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favorites = Favorite::with('book')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($favorites->pluck('book'));
    }

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id' => ['required', 'integer', 'exists:books,id'],
        ]);

        $existing = Favorite::where('user_id', $request->user()->id)
            ->where('book_id', $validated['book_id'])
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['is_favorited' => false]);
        }

        Favorite::create([
            'user_id' => $request->user()->id,
            'book_id' => $validated['book_id'],
        ]);

        return response()->json(['is_favorited' => true]);
    }
}
