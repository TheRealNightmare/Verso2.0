<?php

namespace App\Http\Controllers;

use App\Models\ReadingHistory;
use App\Models\UserUpload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class HistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $history = ReadingHistory::with(['book', 'userUpload'])
            ->where('user_id', $request->user()->id)
            ->orderBy('last_read_at', 'desc')
            ->get();

        return response()->json($history);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id'        => ['nullable', 'required_without:user_upload_id', 'integer', 'exists:books,id'],
            'user_upload_id' => ['nullable', 'required_without:book_id', 'integer', 'exists:user_uploads,id'],
            'progress'       => ['required', 'integer', 'min:0', 'max:100'],
            'current_page'   => ['nullable', 'integer', 'min:0'],
        ]);

        if (!empty($validated['book_id']) && !empty($validated['user_upload_id'])) {
            throw ValidationException::withMessages([
                'book_id' => 'Provide exactly one of book_id or user_upload_id.',
            ]);
        }

        if (!empty($validated['user_upload_id'])) {
            $owns = UserUpload::where('id', $validated['user_upload_id'])
                ->where('user_id', $request->user()->id)
                ->exists();
            if (!$owns) {
                throw ValidationException::withMessages([
                    'user_upload_id' => 'Upload not found.',
                ]);
            }
        }

        $key = !empty($validated['book_id'])
            ? ['user_id' => $request->user()->id, 'book_id' => $validated['book_id'], 'user_upload_id' => null]
            : ['user_id' => $request->user()->id, 'book_id' => null, 'user_upload_id' => $validated['user_upload_id']];

        $values = ['progress' => $validated['progress'], 'last_read_at' => now()];
        if (array_key_exists('current_page', $validated) && $validated['current_page'] !== null) {
            $values['current_page'] = $validated['current_page'];
        }

        $history = ReadingHistory::updateOrCreate($key, $values);

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
