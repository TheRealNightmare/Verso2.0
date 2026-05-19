<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TodoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $todos = Todo::where('user_id', $request->user()->id)
            ->orderBy('position')
            ->orderBy('id')
            ->get(['id', 'title', 'subtitle', 'time', 'done', 'position']);

        return response()->json($todos);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'    => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'time'     => ['nullable', 'string', 'max:32'],
            'done'     => ['nullable', 'boolean'],
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['position'] = (int) Todo::where('user_id', $request->user()->id)->max('position') + 1;

        $todo = Todo::create($validated);

        return response()->json($todo, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $todo = Todo::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'title'    => ['sometimes', 'string', 'max:255'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'time'     => ['sometimes', 'nullable', 'string', 'max:32'],
            'done'     => ['sometimes', 'boolean'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);

        $todo->update($validated);

        return response()->json($todo);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $todo = Todo::where('user_id', $request->user()->id)->findOrFail($id);
        $todo->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
