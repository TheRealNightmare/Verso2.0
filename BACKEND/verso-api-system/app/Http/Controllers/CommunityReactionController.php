<?php

namespace App\Http\Controllers;

use App\Events\CommunityReactionToggled;
use App\Models\CommunityMessage;
use App\Models\CommunityReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CommunityReactionController extends Controller
{
    private const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    public function toggle(Request $request, int $messageId): JsonResponse
    {
        $userId  = $request->user()->id;
        $message = CommunityMessage::findOrFail($messageId);

        $validated = $request->validate([
            'emoji' => ['required', 'string', Rule::in(self::ALLOWED_EMOJIS)],
        ]);

        $existing = CommunityReaction::where([
            'message_id' => $message->id,
            'user_id'    => $userId,
            'emoji'      => $validated['emoji'],
        ])->first();

        if ($existing) {
            $existing->delete();
            $added = false;
        } else {
            CommunityReaction::create([
                'message_id' => $message->id,
                'user_id'    => $userId,
                'emoji'      => $validated['emoji'],
            ]);
            $added = true;
        }

        $reactions = $this->reactionsSummary($message->id, $userId);

        broadcast(new CommunityReactionToggled(
            $message->id, $userId, $validated['emoji'], $added, $reactions,
        ))->toOthers();

        return response()->json([
            'messageId' => $message->id,
            'emoji'     => $validated['emoji'],
            'added'     => $added,
            'reactions' => $reactions,
        ]);
    }

    private function reactionsSummary(int $messageId, int $userId): array
    {
        $rows = CommunityReaction::where('message_id', $messageId)
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
