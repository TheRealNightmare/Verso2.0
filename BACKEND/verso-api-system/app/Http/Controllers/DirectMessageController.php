<?php

namespace App\Http\Controllers;

use App\Events\DirectMessageSent;
use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DirectMessageController extends Controller
{
    private const ONLINE_WINDOW = 60;

    /** Conversation list (inbox): one row per partner with last message + unread count. */
    public function inbox(Request $request): JsonResponse
    {
        $me = $request->user();

        $messages = DirectMessage::where('sender_id', $me->id)
            ->orWhere('recipient_id', $me->id)
            ->orderByDesc('id')
            ->get();

        // Walk newest-first; first time we see a partner is their last message.
        $byPartner = [];
        foreach ($messages as $m) {
            $partnerId = $m->sender_id === $me->id ? $m->recipient_id : $m->sender_id;
            if (! isset($byPartner[$partnerId])) {
                $byPartner[$partnerId] = ['last' => $m, 'unread' => 0];
            }
            if ($m->recipient_id === $me->id && $m->read_at === null) {
                $byPartner[$partnerId]['unread']++;
            }
        }

        $partnerIds = array_keys($byPartner);
        $users = User::whereIn('id', $partnerIds)->get()->keyBy('id');

        $conversations = [];
        foreach ($partnerIds as $pid) {
            $u = $users->get($pid);
            if (! $u) {
                continue;
            }
            $last = $byPartner[$pid]['last'];
            $conversations[] = [
                'user'        => $this->userSummary($u),
                'lastMessage' => [
                    'body'      => $last->body,
                    'mine'      => $last->sender_id === $me->id,
                    'createdAt' => $last->created_at->toIso8601String(),
                ],
                'unread'      => $byPartner[$pid]['unread'],
            ];
        }

        $unreadTotal = array_sum(array_column($byPartner, 'unread'));

        return response()->json([
            'data'        => $conversations,
            'unreadTotal' => $unreadTotal,
        ]);
    }

    /** A thread with one friend. Marks their messages to me as read. */
    public function thread(Request $request, int $userId): JsonResponse
    {
        $me = $request->user();

        if (! $me->isFriendsWith($userId)) {
            abort(403, 'You can only message friends.');
        }

        $other = User::findOrFail($userId);

        DirectMessage::where('sender_id', $userId)
            ->where('recipient_id', $me->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = DirectMessage::where(function ($q) use ($me, $userId) {
            $q->where('sender_id', $me->id)->where('recipient_id', $userId);
        })->orWhere(function ($q) use ($me, $userId) {
            $q->where('sender_id', $userId)->where('recipient_id', $me->id);
        })
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'partner'  => $this->userSummary($other),
            'messages' => $messages->map(fn ($m) => $this->shape($m, $me->id)),
        ]);
    }

    /** Send a message to a friend. */
    public function store(Request $request, int $userId): JsonResponse
    {
        $me = $request->user();

        if ($userId === $me->id) {
            abort(422, 'You cannot message yourself.');
        }

        if (! $me->isFriendsWith($userId)) {
            abort(403, 'You can only message friends.');
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $dm = DirectMessage::create([
            'sender_id'    => $me->id,
            'recipient_id' => $userId,
            'body'         => $validated['body'],
        ]);

        // Push to the recipient's private channel (shaped from their perspective).
        broadcast(new DirectMessageSent($userId, $this->shape($dm, $userId) + [
            'partnerId' => $me->id,
            'sender'    => $this->userSummary($me),
        ]))->toOthers();

        return response()->json($this->shape($dm, $me->id), 201);
    }

    /** Mark all messages from a given user as read. */
    public function markRead(Request $request, int $userId): JsonResponse
    {
        $me = $request->user();

        DirectMessage::where('sender_id', $userId)
            ->where('recipient_id', $me->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    private function shape(DirectMessage $m, int $viewerId): array
    {
        return [
            'id'          => $m->id,
            'senderId'    => $m->sender_id,
            'recipientId' => $m->recipient_id,
            'body'        => $m->body,
            'mine'        => $m->sender_id === $viewerId,
            'readAt'      => optional($m->read_at)->toIso8601String(),
            'createdAt'   => $m->created_at->toIso8601String(),
        ];
    }

    private function userSummary(User $u): array
    {
        return [
            'id'        => $u->id,
            'name'      => $u->name,
            'avatarUrl' => $u->avatar_url,
            'online'    => $u->last_seen_at !== null
                && $u->last_seen_at->gt(now()->subSeconds(self::ONLINE_WINDOW)),
        ];
    }
}
