<?php

namespace App\Http\Controllers;

use App\Events\RoomBroadcast;
use App\Http\Controllers\Concerns\RoomMembership;
use App\Jobs\RoomDetectSpoilerJob;
use App\Models\RoomMessage;
use App\Models\RoomReaction;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoomMessageController extends Controller
{
    use RoomMembership;

    private const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    public function index(Request $request, int $roomId): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = $this->findRoom($roomId);
        $this->requireMember($room, $userId);

        $limit    = min((int) $request->query('limit', 50), 200);
        $before   = $request->query('before');
        $parentId = $request->query('parent_id');

        $query = RoomMessage::query()
            ->where('room_id', $roomId)
            ->with(['user:id,name,avatar_url,role']);

        if ($parentId !== null && $parentId !== '') {
            $parent = RoomMessage::where('room_id', $roomId)->findOrFail((int) $parentId);
            $query->where('parent_id', $parent->id)->orderBy('id');
        } else {
            $query->whereNull('parent_id')->orderByDesc('id');
        }

        if ($before) {
            $query->where('id', '<', (int) $before);
        }

        $messages = $query->limit($limit)->get();

        if (! $parentId) {
            $messages = $messages->reverse()->values();
        }

        $payload = [
            'messages' => $messages->map(fn ($m) => $this->shape($m, $userId)),
        ];

        if ($parentId) {
            $payload['parent'] = isset($parent)
                ? $this->shape($parent->loadMissing('user:id,name,avatar_url,role'), $userId)
                : null;
        }

        return response()->json($payload);
    }

    public function store(Request $request, int $roomId): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = $this->findRoom($roomId);
        $this->requireMember($room, $userId);

        $type = $request->input('type', 'text');

        $base = $request->validate([
            'type'       => ['required', 'in:text,audio,image'],
            'body'       => ['nullable', 'string', 'max:5000'],
            'parent_id'  => ['nullable', 'integer', 'exists:room_messages,id'],
            'is_spoiler' => ['nullable', 'boolean'],
        ]);

        $selfTag = $request->boolean('is_spoiler');

        if (! empty($base['parent_id'])) {
            $parent = RoomMessage::where('room_id', $roomId)->findOrFail((int) $base['parent_id']);
            if ($parent->parent_id !== null) {
                abort(422, 'Replies cannot themselves be replied to.');
            }
        }

        $data = [
            'room_id'    => $roomId,
            'user_id'    => $userId,
            'type'       => $type,
            'body'       => $base['body'] ?? null,
            'parent_id'  => $base['parent_id'] ?? null,
            'is_spoiler' => false,
        ];

        if ($selfTag) {
            $data['is_spoiler']         = true;
            $data['spoiler_source']     = 'user';
            $data['spoiler_checked_at'] = now();
        }

        if ($type === 'audio') {
            $audio = $request->validate([
                'audio'        => ['required', 'file', 'mimetypes:audio/webm,audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/x-wav', 'max:10240'],
                'duration_sec' => ['required', 'integer', 'min:1', 'max:7200'],
            ]);
            $data['audio_path']   = $request->file('audio')->store('room-audio', 'public');
            $data['duration_sec'] = (int) $audio['duration_sec'];
        } elseif ($type === 'image') {
            $request->validate([
                'image' => ['required', 'file', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
            ]);
            $data['image_path'] = $request->file('image')->store('room-images', 'public');
        } else {
            if (empty($data['body'])) {
                abort(422, 'Text messages require a body.');
            }
        }

        $message = RoomMessage::create($data);
        $message->load('user:id,name,avatar_url,role');

        $payload = $this->shape($message, $userId);

        broadcast(new RoomBroadcast($roomId, 'message.sent', $payload))->toOthers();

        if (! $selfTag
            && in_array($type, ['text', 'image'], true)
            && app(GeminiService::class)->enabled()) {
            RoomDetectSpoilerJob::dispatch($message->id)->afterResponse();
        }

        return response()->json($payload, 201);
    }

    public function update(Request $request, int $roomId, int $id): JsonResponse
    {
        $userId = $request->user()->id;
        $this->requireMember($this->findRoom($roomId), $userId);

        $message = RoomMessage::where('room_id', $roomId)->findOrFail($id);

        if ($message->user_id !== $userId) {
            abort(403, 'Only the author can edit this message.');
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $now = now();
        $message->update(['body' => $validated['body'], 'edited_at' => $now]);

        broadcast(new RoomBroadcast($roomId, 'message.updated', [
            'id'       => $message->id,
            'body'     => $message->body,
            'editedAt' => $now->toIso8601String(),
        ]))->toOthers();

        $message->load('user:id,name,avatar_url,role');

        return response()->json($this->shape($message, $userId));
    }

    public function destroy(Request $request, int $roomId, int $id): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = $this->findRoom($roomId);
        $this->requireMember($room, $userId);

        $message = RoomMessage::where('room_id', $roomId)->findOrFail($id);

        if ($message->user_id !== $userId && $room->owner_id !== $userId) {
            abort(403, 'Only the author or room owner can delete this message.');
        }

        $message->delete();

        broadcast(new RoomBroadcast($roomId, 'message.deleted', ['id' => $message->id]))->toOthers();

        return response()->json(['message' => 'Deleted.']);
    }

    public function toggleReaction(Request $request, int $roomId, int $id): JsonResponse
    {
        $userId = $request->user()->id;
        $this->requireMember($this->findRoom($roomId), $userId);

        $message = RoomMessage::where('room_id', $roomId)->findOrFail($id);

        $validated = $request->validate([
            'emoji' => ['required', 'string', \Illuminate\Validation\Rule::in(self::ALLOWED_EMOJIS)],
        ]);

        $existing = RoomReaction::where([
            'message_id' => $message->id,
            'user_id'    => $userId,
            'emoji'      => $validated['emoji'],
        ])->first();

        if ($existing) {
            $existing->delete();
            $added = false;
        } else {
            RoomReaction::create([
                'message_id' => $message->id,
                'user_id'    => $userId,
                'emoji'      => $validated['emoji'],
            ]);
            $added = true;
        }

        $reactions = $this->reactionsSummary($message->id, $userId);

        broadcast(new RoomBroadcast($roomId, 'reaction.toggled', [
            'messageId' => $message->id,
            'emoji'     => $validated['emoji'],
            'added'     => $added,
            'reactions' => $reactions,
        ]))->toOthers();

        return response()->json([
            'messageId' => $message->id,
            'emoji'     => $validated['emoji'],
            'added'     => $added,
            'reactions' => $reactions,
        ]);
    }

    private function shape(RoomMessage $m, int $userId): array
    {
        return [
            'id'        => $m->id,
            'parentId'  => $m->parent_id,
            'type'      => $m->type,
            'body'      => $m->body,
            'audio'     => $m->type === 'audio'
                ? ['durationSec' => $m->duration_sec, 'url' => $m->audio_url]
                : null,
            'image'     => $m->type === 'image' ? ['url' => $m->image_url] : null,
            'isSpoiler' => (bool) $m->is_spoiler,
            'editedAt'  => optional($m->edited_at)->toIso8601String(),
            'createdAt' => $m->created_at->toIso8601String(),
            'mine'      => $m->user_id === $userId,
            'author'    => [
                'id'        => $m->user_id,
                'name'      => $m->user?->name,
                'avatarUrl' => $m->user?->avatar_url,
                'role'      => $m->user?->role,
            ],
            'reactions' => $this->reactionsSummary($m->id, $userId),
        ];
    }

    private function reactionsSummary(int $messageId, int $userId): array
    {
        $rows = RoomReaction::where('message_id', $messageId)
            ->select('emoji', DB::raw('COUNT(*) as cnt'), DB::raw('SUM(CASE WHEN user_id = '.(int) $userId.' THEN 1 ELSE 0 END) as mine'))
            ->groupBy('emoji')
            ->get();

        $out = [];
        foreach (self::ALLOWED_EMOJIS as $emoji) {
            $row = $rows->firstWhere('emoji', $emoji);
            if ($row) {
                $out[$emoji] = ['count' => (int) $row->cnt, 'mine' => (bool) $row->mine];
            }
        }
        return $out;
    }
}
