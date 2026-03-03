<?php

namespace App\Http\Commands;

use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Moderation\UserModeration;
use App\Models\User;
use App\Models\User\UserFeedProfile;
use App\Models\User\UserFile;
use App\Models\User\UserSearchPreference;
use App\Models\User\UserSettings;
use App\Models\User\UserSwipe;
use App\Services\Subscription\SubscriptionManager;
use Exception;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Commands\Command;

class DeleteProfileCommand extends Command
{
    protected string $name = 'delete';
    protected string $description = 'Delete profile';

    public function handle(): void
    {
        Log::info('DeleteProfileCommand::handle() called');

        $userId = $this->getUpdate()->getChat()->getId();
        Log::info('received delete command for user: ' . $userId);

        DB::beginTransaction();
        try {

            /** @var User $user */
            $user = User::query()->findOrFail($userId);

            $feedProfile = UserFeedProfile::query()->where('user_id', $userId)->first();
            if ($feedProfile !== null) {
                $feedProfile->delete();
                UserSwipe::query()->where('profile_id', $feedProfile->id)->delete();
            }

            UserFile::query()->where('user_id', $userId)->forceDelete();
            UserModeration::query()->where('user_id', $userId)->delete();
            UserSearchPreference::query()->where('user_id', $userId)->delete();
            UserSettings::query()->where('user_id', $userId)->delete();

            $chatIds = DB::table('chat_users')
                ->where('user_id', $userId)
                ->get()
                ->pluck('chat_id')
                ->toArray();

            DB::table('chat_users')
                ->whereIn('chat_id', $chatIds)
                ->delete();

            Chat::query()->whereIn('id', $chatIds)->delete();
            ChatMessage::query()->whereIn('chat_id', $chatIds)->delete();

            UserSwipe::query()->where('user_id', $userId)->delete();

            /** @var SubscriptionManager $subscriptionManager */
            $subscriptionManager = App::make(SubscriptionManager::class);

            $subscriptionManager->driver('stripe')->cancel($user);
            $subscriptionManager->driver('telegram')->cancel($user);

            $user->update([
                'is_premium' => false,
                'is_onboarded' => false,
                'is_trial_used' => false,
                'is_under_moderation' => false,
            ]);

            DB::commit();
            $this->replyWithMessage([
                'text' => 'Profile deleted',
            ]);
        } catch (Exception $exception) {
            DB::rollBack();
            Log::error($exception->getMessage());
            $this->replyWithMessage([
                'text' => 'Error occurred',
            ]);
        }
    }
}
