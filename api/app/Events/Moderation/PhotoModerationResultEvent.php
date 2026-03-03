<?php

namespace App\Events\Moderation;

use App\Dto\User\UserDto;
use App\Enums\Moderation\RejectionReasonEnum;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PhotoModerationResultEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        private readonly UserDto $userDto,
        private readonly RejectionReasonEnum|null $rejectionReason = null,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('user.' . $this->userDto->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'photo.moderation.result';
    }

    public function broadcastWith(): array
    {
        return [
            'is_rejected' => (bool)$this->rejectionReason,
            'rejection_reason' => $this->rejectionReason?->value,
        ];
    }
}
