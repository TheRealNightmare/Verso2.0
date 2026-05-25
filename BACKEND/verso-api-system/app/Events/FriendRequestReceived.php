<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FriendRequestReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $addresseeId,
        public array $payload,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->addresseeId)];
    }

    public function broadcastAs(): string
    {
        return 'friend.request.received';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
