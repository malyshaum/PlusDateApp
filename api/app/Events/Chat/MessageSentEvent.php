<?php

namespace App\Events\Chat;

use App\Dto\Chat\ChatMessageDto;
use App\Models\User;
use App\Models\User\UserFile;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class MessageSentEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        private readonly ChatMessageDto $messageDto,
    ) {}

    public function broadcastOn(): array
    {
        $usersToNotify = DB::table('chat_users')
            ->whereNot('user_id', $this->messageDto->senderId)
            ->where('chat_id', $this->messageDto->chatId)
            ->pluck('user_id');

        $channels = [];
        foreach ($usersToNotify as $userId) {
            $channels[] = new Channel('user.' . $userId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message.received';
    }

    public function broadcastWith(): array
    {
        $profilePhoto = UserFile::query()
            ->where('user_id', $this->messageDto->senderId)
            ->where('is_main', true)
            ->first();

        $user = User::query()
            ->select(['name'])
            ->where('id', $this->messageDto->senderId)
            ->first();

        return [
            'id' => $this->messageDto->id,
            'sender_id' => $this->messageDto->senderId,
            'chat_id' => $this->messageDto->chatId,
            'message' => $this->messageDto->message,
            'name' => $user->name,
            'photo_url' => $profilePhoto?->url,
        ];
    }
}
