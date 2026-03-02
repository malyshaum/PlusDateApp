<?php

namespace App\Events\Chat;

use App\Dto\Chat\ChatDto;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class ChatCreatedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        private readonly ChatDto $chatDto,
        private readonly int $userId,
        private readonly int $otherUserId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('user.' . $this->userId),
            new Channel('user.' . $this->otherUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'chat.created';
    }

    public function broadcastWith(): array
    {
        return [
            'chat' => $this->chatDto->toArray(),
            'timestamp' => Carbon::now(),
        ];
    }
}