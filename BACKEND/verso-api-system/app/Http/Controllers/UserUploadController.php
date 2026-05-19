<?php

namespace App\Http\Controllers;

use App\Models\UserUpload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserUploadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $uploads = UserUpload::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($uploads);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'     => ['required', 'string', 'max:255'],
            'author'    => ['nullable', 'string', 'max:255'],
            'format'    => ['required', 'in:txt,epub,pdf'],
            'file_hash' => ['required', 'string', 'size:64'],
            'file_size' => ['required', 'integer', 'min:1', 'max:104857600'],
        ]);

        $upload = UserUpload::firstOrCreate(
            [
                'user_id'   => $request->user()->id,
                'file_hash' => $validated['file_hash'],
            ],
            [
                'title'     => $validated['title'],
                'author'    => $validated['author'] ?? null,
                'format'    => $validated['format'],
                'file_size' => $validated['file_size'],
            ]
        );

        return response()->json($upload, $upload->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $upload = UserUpload::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $upload->delete();

        return response()->json(['message' => 'Upload removed.']);
    }
}
