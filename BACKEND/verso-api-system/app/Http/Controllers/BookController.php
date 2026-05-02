<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function home(): JsonResponse
    {
        $latest = Book::orderBy('created_at', 'desc')->limit(10)->get();

        $recommended = Book::orderBy('average_rating', 'desc')->limit(10)->get();

        $exclusive = Book::where('is_exclusive', true)->orderBy('average_rating', 'desc')->limit(10)->get();

        $highlyRated = Book::has('reviews', '>=', 3)
            ->orderBy('average_rating', 'desc')
            ->limit(10)
            ->get();

        $topFavoriteBookIds = Favorite::selectRaw('book_id, count(*) as fav_count')
            ->groupBy('book_id')
            ->orderByDesc('fav_count')
            ->limit(10)
            ->pluck('book_id');

        $favorites = Book::whereIn('id', $topFavoriteBookIds)->get();

        return response()->json([
            'latest'      => $latest,
            'recommended' => $recommended,
            'exclusive'   => $exclusive,
            'highly_rated' => $highlyRated,
            'favorites'   => $favorites,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Book::query();

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                  ->orWhere('author', 'like', "%{$term}%");
            });
        }

        if ($request->filled('genre')) {
            $query->where('genre', $request->genre);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function show(int $id): JsonResponse
    {
        $book = Book::withCount('reviews')
            ->with(['reviews.user:id,name'])
            ->findOrFail($id);

        return response()->json($book);
    }
}
