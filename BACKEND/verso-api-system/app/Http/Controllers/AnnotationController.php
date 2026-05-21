<?php

namespace App\Http\Controllers;

use App\Models\Annotation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnotationController extends Controller
{
    public function index(Request $request, int $bookId): JsonResponse
    {
        $annotations = Annotation::where('user_id', $request->user()->id)
            ->where('book_id', $bookId)
            ->orderBy('page_index')
            ->orderBy('column')
            ->orderBy('start_offset')
            ->get([
                'id', 'book_id', 'page_index', 'column',
                'start_offset', 'end_offset', 'selected_text', 'note', 'color',
            ]);

        return response()->json($annotations);
    }

    public function store(Request $request, int $bookId): JsonResponse
    {
        $validated = $request->validate([
            'page_index'    => ['required', 'integer', 'min:0'],
            'column'        => ['required', 'string', 'in:left,right'],
            'start_offset'  => ['required', 'integer', 'min:0'],
            'end_offset'    => ['required', 'integer', 'min:0'],
            'selected_text' => ['required', 'string'],
            'note'          => ['nullable', 'string'],
            'color'         => ['nullable', 'string', 'max:32'],
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['book_id'] = $bookId;

        $annotation = Annotation::create($validated);

        return response()->json($annotation, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $annotation = Annotation::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'note'  => ['sometimes', 'nullable', 'string'],
            'color' => ['sometimes', 'nullable', 'string', 'max:32'],
        ]);

        $annotation->update($validated);

        return response()->json($annotation);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $annotation = Annotation::where('user_id', $request->user()->id)->findOrFail($id);
        $annotation->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
