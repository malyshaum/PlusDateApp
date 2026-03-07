<?php

namespace App\Jobs\Moderation;

use App\Dto\User\UserDto;
use App\Enums\Telegram\TelegramMessageEnum;
use App\Exceptions\ApiException;
use App\Services\TelegramService;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ValidateUserProfileJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private readonly UserDto $userDto,
    )
    {
        //
    }

    /**
     * @throws ApiException
     * @throws Exception
     */
    public function handle(
        TelegramService $telegramService,
    ): void
    {
        $telegramService->sendMessage($this->userDto->id, TelegramMessageEnum::MODERATION_BEGIN_MESSAGE);
        $telegramService->sendAdminCheckMessage($this->userDto);
    }
}
