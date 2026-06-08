<?php

namespace App\Http\Controllers;

use App\Events\RoomBroadcast;
use App\Http\Controllers\Concerns\RoomMembership;
use App\Models\RoomAnnotation;
use App\Models\RoomAnnotationComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomAnnotationCommentController extends Controller
{
    use RoomMembership;

    public function index(Request $request, int $annotationId): JsonResponse
    {
        $annotation = RoomAnnotation::findOrFail($annotationId);
        $room       = $this->findRoom($annotation->room_id);
        $this->requireMember($room, $request->user()->id);

        $comments = RoomAnnotationComment::with('user:id,name,avatar_url')
            ->where('room_annotation_id', $annotationId)
            ->orderBy('id')
            ->get();

        return response()->json($comments->map(fn ($c) => $this->shape($c)));
    }

    public function store(Request $request, int $annotationId): JsonResponse
    {
        $userId     = $request->user()->id;
        $annotation = RoomAnnotation::findOrFail($annotationId);
        $room       = $this->findRoom($annotation->room_id);
        $this->requireMember($room, $userId);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $comment = RoomAnnotationComment::create([
            'room_annotation_id' => $annotationId,
            'user_id'            => $userId,
            'body'               => $validated['body'],
        ]);
        $annotation->increment('comment_count');
        $comment->load('user:id,name,avatar_url');

        $payload = $this->shape($comment);
        broadcast(new RoomBroadcast($room->id, 'comment.added', $payload))->toOthers();

        return response()->json($payload, 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId     = $request->user()->id;
        $comment    = RoomAnnotationComment::findOrFail($id);
        $annotation = RoomAnnotation::findOrFail($comment->room_annotation_id);
        $room       = $this->findRoom($annotation->room_id);

        if ($comment->user_id !== $userId && $room->owner_id !== $userId) {
            abort(403, 'You cannot delete this comment.');
        }

        $comment->delete();
        if ($annotation->comment_count > 0) {
            $annotation->decrement('comment_count');
        }

        broadcast(new RoomBroadcast($room->id, 'comment.deleted', [
            'id'          => $id,
            'highlightId' => $annotation->id,
        ]))->toOthers();

        return response()->json(['message' => 'Deleted.']);
    }

    private function shape(RoomAnnotationComment $c): array
    {
        return [
            'id'          => $c->id,
            'highlightId' => $c->room_annotation_id,
            'body'        => $c->body,
            'author'      => [
                'id'        => $c->user_id,
                'name'      => $c->user?->name,
                'avatarUrl' => $c->user?->avatar_url,
            ],
            'createdAt'   => $c->created_at?->toIso8601String(),
        ];
    }
}
