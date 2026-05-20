<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunityMessageUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $id;
    public ?string $body;
    public string $editedAt;

    public function __construct(int $id, ?string $body, string $editedAt)
    {
        $this->id = $id;
        $this->body = $body;
        $this->editedAt = $editedAt;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('community')];
    }

    public function broadcastAs(): string
    {
        return 'message.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id'       => $this->id,
            'body'     => $this->body,
            'editedAt' => $this->editedAt,
        ];
    }
}
