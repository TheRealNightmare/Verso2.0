<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Generic real-time event for a reading room's private channel. Mirrors the
 * community broadcast pattern but is parameterized by event name + payload so a
 * single class serves highlights, comments, presence, and chat events.
 */
class RoomBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $roomId,
        public string $event,
        public array $payload,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('reading-room.'.$this->roomId)];
    }

    public function broadcastAs(): string
    {
        return $this->event;
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
