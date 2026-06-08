<?php

namespace App\Jobs;

use App\Events\RoomBroadcast;
use App\Models\RoomMessage;
use App\Services\GeminiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RoomDetectSpoilerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    public function __construct(public int $messageId)
    {
    }

    public function handle(GeminiService $gemini): void
    {
        $message = RoomMessage::find($this->messageId);

        // Gone (soft-deleted excluded automatically), or already flagged.
        if (! $message || $message->is_spoiler) {
            return;
        }

        $result = $message->type === 'image'
            ? $gemini->classifyImageSpoiler((string) $message->image_path)
            : $gemini->classifyTextSpoiler((string) $message->body);

        $message->spoiler_checked_at = now();

        if ($result === true) {
            $message->is_spoiler = true;
            $message->spoiler_source = 'ai';
        }

        $message->save();

        if ($result === true) {
            broadcast(new RoomBroadcast($message->room_id, 'message.spoiler', [
                'id'        => $message->id,
                'isSpoiler' => true,
                'source'    => 'ai',
            ]));
        }
    }
}
