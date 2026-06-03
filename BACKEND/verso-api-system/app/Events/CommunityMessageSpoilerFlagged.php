<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunityMessageSpoilerFlagged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $id;
    public bool $isSpoiler;
    public string $source;

    public function __construct(int $id, bool $isSpoiler, string $source)
    {
        $this->id = $id;
        $this->isSpoiler = $isSpoiler;
        $this->source = $source;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('community')];
    }

    public function broadcastAs(): string
    {
        return 'message.spoiler';
    }

    public function broadcastWith(): array
    {
        return [
            'id'        => $this->id,
            'isSpoiler' => $this->isSpoiler,
        ];
    }
}
