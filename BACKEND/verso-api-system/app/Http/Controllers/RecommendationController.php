<?php

namespace App\Http\Controllers;

use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function __construct(private RecommendationService $recommendations)
    {
    }

    public function books(Request $request): JsonResponse
    {
        $result = $this->recommendations->booksFor($request->user());

        return response()->json($result);
    }

    public function people(Request $request): JsonResponse
    {
        $people = $this->recommendations->peopleFor($request->user());

        return response()->json(['people' => $people]);
    }
}
