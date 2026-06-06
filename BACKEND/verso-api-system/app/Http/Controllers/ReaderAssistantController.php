<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReaderAssistantController extends Controller
{
    public function __construct(private GeminiService $gemini)
    {
    }

    /**
     * Answer a reader's question about a highlighted passage via Gemini.
     */
    public function ask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'selected_text' => ['required', 'string', 'max:6000'],
            'question'      => ['required', 'string', 'max:1000'],
            'book_title'    => ['nullable', 'string', 'max:255'],
        ]);

        if (! $this->gemini->enabled()) {
            return response()->json(
                ['message' => 'The AI assistant is not available right now.'],
                503,
            );
        }

        $answer = $this->gemini->answerAboutPassage(
            $validated['selected_text'],
            $validated['question'],
            $validated['book_title'] ?? null,
        );

        if ($answer === null) {
            return response()->json(
                ['message' => 'Could not get an answer right now. Please try again.'],
                502,
            );
        }

        return response()->json(['answer' => $answer]);
    }
}
