<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomInviteSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $inviteeId,
        public array $payload,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->inviteeId)];
    }

    public function broadcastAs(): string
    {
        return 'room.invite';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
