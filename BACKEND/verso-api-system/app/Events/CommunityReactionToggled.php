<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunityReactionToggled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $messageId;
    public int $userId;
    public string $emoji;
    public bool $added;
    public array $reactions;

    public function __construct(int $messageId, int $userId, string $emoji, bool $added, array $reactions)
    {
        $this->messageId = $messageId;
        $this->userId    = $userId;
        $this->emoji     = $emoji;
        $this->added     = $added;
        $this->reactions = $reactions;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('community')];
    }

    public function broadcastAs(): string
    {
        return 'reaction.toggled';
    }

    public function broadcastWith(): array
    {
        return [
            'messageId' => $this->messageId,
            'userId'    => $this->userId,
            'emoji'     => $this->emoji,
            'added'     => $this->added,
            'reactions' => $this->reactions,
        ];
    }
}
