<?php

namespace App\Events\Feed;

use Carbon\Carbon;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class MatchEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        private readonly int $userId,
        private readonly int $chatId,
        private readonly int $matchId,
        private readonly string|null $filepath,
    )
    {
        //
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('user.'.$this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'user.match';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chatId,
            'user_id' => $this->matchId,
            'photo_url' => $this->filepath ? Storage::temporaryUrl($this->filepath, Carbon::now()->addDay()) : null,
        ];
    }
}
