<?php

namespace App\Jobs;

use App\Events\CommunityMessageSpoilerFlagged;
use App\Models\CommunityMessage;
use App\Services\GeminiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DetectSpoilerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    public function __construct(public int $messageId)
    {
    }

    public function handle(GeminiService $gemini): void
    {
        $message = CommunityMessage::find($this->messageId);

        // Gone (soft-deleted excluded automatically), or already flagged
        // (e.g. the author self-tagged it before this job ran).
        if (! $message || $message->is_spoiler) {
            return;
        }

        $result = $message->type === 'image'
            ? $gemini->classifyImageSpoiler((string) $message->image_path)
            : $gemini->classifyTextSpoiler((string) $message->body);

        // Record that we checked so polling/re-fetch never reprocesses it.
        $message->spoiler_checked_at = now();

        if ($result === true) {
            $message->is_spoiler = true;
            $message->spoiler_source = 'ai';
        }

        $message->save();

        if ($result === true) {
            broadcast(new CommunityMessageSpoilerFlagged($message->id, true, 'ai'));
        }
    }
}
