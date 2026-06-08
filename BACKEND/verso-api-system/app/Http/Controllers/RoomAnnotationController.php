<?php

namespace App\Http\Controllers;

use App\Events\RoomBroadcast;
use App\Http\Controllers\Concerns\RoomMembership;
use App\Models\RoomAnnotation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomAnnotationController extends Controller
{
    use RoomMembership;

    public function index(Request $request, int $roomId): JsonResponse
    {
        $room = $this->findRoom($roomId);
        $this->requireMember($room, $request->user()->id);

        $annotations = RoomAnnotation::with('user:id,name,avatar_url')
            ->where('room_id', $roomId)
            ->orderBy('page_index')
            ->orderBy('start_offset')
            ->get();

        return response()->json($annotations->map(fn ($a) => $this->shape($a)));
    }

    public function store(Request $request, int $roomId): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = $this->findRoom($roomId);
        $member = $this->requireMember($room, $userId);

        $validated = $request->validate([
            'page_index'    => ['required', 'integer', 'min:0'],
            'column'        => ['required', 'string', 'in:left,right'],
            'start_offset'  => ['required', 'integer', 'min:0'],
            'end_offset'    => ['required', 'integer', 'min:0'],
            'selected_text' => ['required', 'string'],
            'note'          => ['nullable', 'string'],
        ]);

        $annotation = RoomAnnotation::create([
            'room_id'       => $roomId,
            'user_id'       => $userId,
            'book_id'       => $room->book_id,
            'page_index'    => $validated['page_index'],
            'column'        => $validated['column'],
            'start_offset'  => $validated['start_offset'],
            'end_offset'    => $validated['end_offset'],
            'selected_text' => $validated['selected_text'],
            'note'          => $validated['note'] ?? null,
            'color'         => $member->highlight_color,
        ]);
        $annotation->load('user:id,name,avatar_url');

        $payload = $this->shape($annotation);
        broadcast(new RoomBroadcast($roomId, 'highlight.added', $payload))->toOthers();

        return response()->json($payload, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $userId     = $request->user()->id;
        $annotation = RoomAnnotation::findOrFail($id);

        if ($annotation->user_id !== $userId) {
            abort(403, 'Only the author can edit this highlight.');
        }

        $validated = $request->validate([
            'note'  => ['sometimes', 'nullable', 'string'],
            'color' => ['sometimes', 'nullable', 'string', 'max:9'],
        ]);

        $annotation->update($validated);
        $annotation->load('user:id,name,avatar_url');

        $payload = $this->shape($annotation);
        broadcast(new RoomBroadcast($annotation->room_id, 'highlight.updated', $payload))->toOthers();

        return response()->json($payload);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId     = $request->user()->id;
        $annotation = RoomAnnotation::findOrFail($id);
        $room       = $this->findRoom($annotation->room_id);

        // Author or room owner may delete.
        if ($annotation->user_id !== $userId && $room->owner_id !== $userId) {
            abort(403, 'You cannot delete this highlight.');
        }

        $roomId = $annotation->room_id;
        $annotation->delete();

        broadcast(new RoomBroadcast($roomId, 'highlight.deleted', ['id' => $id]))->toOthers();

        return response()->json(['message' => 'Deleted.']);
    }

    private function shape(RoomAnnotation $a): array
    {
        return [
            'id'           => $a->id,
            'roomId'       => $a->room_id,
            'pageIndex'    => $a->page_index,
            'column'       => $a->column,
            'startOffset'  => $a->start_offset,
            'endOffset'    => $a->end_offset,
            'selectedText' => $a->selected_text,
            'note'         => $a->note,
            'color'        => $a->color,
            'commentCount' => $a->comment_count,
            'author'       => [
                'id'        => $a->user_id,
                'name'      => $a->user?->name,
                'avatarUrl' => $a->user?->avatar_url,
            ],
            'createdAt'    => $a->created_at?->toIso8601String(),
        ];
    }
}
