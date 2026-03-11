<?php

namespace App\Services\Notification;

use App\Enums\Core\SwipeActionEnum;
use App\Enums\Telegram\BotNotificationTypeEnum;
use App\Models\BotNotification;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\TelegramService;
use AutoMapperPlus\Exception\UnregisteredMappingException;
use Exception;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Exception\UnexpectedValueException;

final readonly class NotificationService
{
    const string NEW_MESSAGES_KEY = 'bot_notification.new_messages';
    const string NEW_MATCHES_KEY = 'bot_notification.new_matches';
    const string NEW_LIKES_KEY = 'bot_notification.new_likes';

    public function __construct(
        private TelegramService $telegramService,
        private UserRepository $userRepository,
    )
    {

    }

    /**
     * @throws UnregisteredMappingException
     */
    public function notifyIfNeeded(int $userId, BotNotificationTypeEnum $notificationType): void
    {
        /** @var User $user */
        $user = User::query()->where('id', $userId)->first();

        if (
            $user->username === 'plusdate_internal_bot'
            || Carbon::parse($user->last_active_at)->gt(Carbon::now()->subMinute())
        ) {
            return;
        }

        $lastNotification = BotNotification::query()
            ->where('user_id', $userId)
            ->where('type', $notificationType)
            ->orderBy('created_at','desc')
            ->limit(1)
            ->first();

        if ($lastNotification !== null && $lastNotification->created_at->gt(Carbon::now()->subHour())) {
            return;
        }

        if ($lastNotification === null) {
            $lastNotification = new BotNotification();
            $lastNotification->user_id = $userId;
            $lastNotification->created_at = Carbon::now()->startOfDay();
            $lastNotification->type = $notificationType->value;
        }

        $count = match ($lastNotification->type) {
            BotNotificationTypeEnum::LIKES->value => $this->getLikesCount($lastNotification),
            BotNotificationTypeEnum::MATCHES->value => $this->getMatchesCount($lastNotification),
            BotNotificationTypeEnum::MESSAGES->value => $this->getMessagesCount($lastNotification),
            default => throw new UnexpectedValueException('Unexpected notification type: ' . $lastNotification->type),
        };

        if ($count === 0) {
            return;
        }

        $userDto = $this->userRepository->getById($lastNotification->user_id);

        $imagePath = 'images/notification/'.$userDto->languageCode.'_'.$lastNotification->type.'.webp';
        $imagePath = public_path($imagePath);

        $text = $this->getNotificationMessage($lastNotification->type, $count, $userDto->languageCode);

        DB::beginTransaction();
        try {
            BotNotification::query()->create([
                'user_id' => $userId,
                'type' => $notificationType->value,
                'created_at' => Carbon::now(),
            ]);

            $this->telegramService->sendNotificationMessage($userId, $text, $imagePath);

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            Log::error($e->getMessage());
        }
    }

    private function getNotificationMessage(string $type, int $count, string $locale): string
    {
        $keyMap = [
            BotNotificationTypeEnum::LIKES->value => self::NEW_LIKES_KEY,
            BotNotificationTypeEnum::MATCHES->value => self::NEW_MATCHES_KEY,
            BotNotificationTypeEnum::MESSAGES->value => self::NEW_MESSAGES_KEY,
        ];

        $key = $keyMap[$type] ?? throw new UnexpectedValueException('Unexpected notification type: ' . $type);

        if ($locale === 'ru') {
            return $this->getRussianMessage($key, $count, $locale);
        } else {
            if ($count > 1 ) {
                $key .= ".few";
            } else {
                $key .= ".one";
            }
        }

        return Lang::get($key, replace: ['count' => $count ], locale: $locale);
    }

    private function getRussianMessage(string $baseKey, int $count, string $locale): string
    {
        $form = $this->getRussianPluralForm($count);
        $translationKey = "$baseKey.$form";

        return Lang::get($translationKey, ['count' => $count], $locale);
    }

    private function getRussianPluralForm(int $count): string
    {
        $remainder10 = $count % 10;
        $remainder100 = $count % 100;

        if ($remainder10 === 1 && $remainder100 !== 11) {
            return 'one';
        }

        if (in_array($remainder10, [2, 3, 4]) && !in_array($remainder100, [12, 13, 14])) {
            return 'few';
        }

        return 'many';
    }

    private function getMessagesCount(BotNotification $lastNotification): int
    {
        return DB::table('chat_messages')
            ->join('chat_users', function($join) use ($lastNotification) {
                $join->on('chat_messages.chat_id', '=', 'chat_users.chat_id')
                    ->where('chat_users.user_id', '=', $lastNotification->user_id);
            })
            ->where('chat_messages.sender_id', '!=', $lastNotification->user_id)
            ->where('chat_messages.created_at', '>', $lastNotification->created_at)
            ->whereNull('chat_messages.read_at')
            ->count();
    }

    /**
     * @throws UnregisteredMappingException
     */
    private function getLikesCount(BotNotification $lastNotification): int
    {
        $userDto = $this->userRepository->getById($lastNotification->user_id);

        return DB::table('user_swipes')
            ->join('users', 'users.id', '=', 'user_swipes.user_id')
            ->where('users.is_under_moderation', false)
            ->where('users.is_onboarded', true)
            ->where('user_swipes.profile_id', $userDto->feedProfile->id)
            ->whereIn('user_swipes.action', [SwipeActionEnum::LIKE->value, SwipeActionEnum::SUPERLIKE->value])
            ->where('user_swipes.created_at', '>', $lastNotification->created_at)
            ->count();
    }

    /**
     * @throws UnregisteredMappingException
     */
    private function getMatchesCount(BotNotification $lastNotification): int
    {
        $userDto = $this->userRepository->getById($lastNotification->user_id);

        return DB::table('user_swipes')
            ->where('user_id', $userDto->id)
            ->whereIn('action', [SwipeActionEnum::SUPERLIKE->value, SwipeActionEnum::LIKE->value])
            ->where('is_match', true)
            ->where('created_at', '>', $lastNotification->created_at)
            ->count();
    }
}
