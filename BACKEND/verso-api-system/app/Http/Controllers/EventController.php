<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    private array $rules = [
        'title'       => ['required', 'string', 'max:255'],
        'subtitle'    => ['nullable', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'date'        => ['required', 'date_format:Y-m-d'],
        'time_from'   => ['required', 'date_format:H:i'],
        'time_to'     => ['required', 'date_format:H:i', 'after:time_from'],
        'category'    => ['required', 'in:movie,writer,play,genre'],
        'host'        => ['required', 'string', 'max:255'],
        'location'    => ['required', 'string', 'max:255'],
        'cover_image' => ['nullable', 'image', 'max:5120'],
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Event::query()->orderBy('date', 'asc')->orderBy('time_from', 'asc');

        if ($from = $request->query('from')) {
            $query->where('date', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('date', '<=', $to);
        }

        return response()->json($query->get());
    }

    public function show(int $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        return response()->json($event);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules);

        $data = collect($validated)->except('cover_image')->all();
        $data['user_id'] = $request->user()->id;

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('events', 'public');
        }

        $event = Event::create($data);

        return response()->json($event, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $event = Event::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $rules = collect($this->rules)
            ->map(fn ($r) => array_merge(['sometimes'], $r))
            ->all();

        $validated = $request->validate($rules);
        $data = collect($validated)->except('cover_image')->all();

        if ($request->hasFile('cover_image')) {
            if ($event->cover_image) {
                Storage::disk('public')->delete($event->cover_image);
            }
            $data['cover_image'] = $request->file('cover_image')->store('events', 'public');
        }

        $event->update($data);

        return response()->json($event->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $event = Event::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($event->cover_image) {
            Storage::disk('public')->delete($event->cover_image);
        }

        $event->delete();

        return response()->json(['message' => 'Event removed.']);
    }
}
