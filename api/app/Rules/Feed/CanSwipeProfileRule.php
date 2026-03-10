<?php

namespace App\Rules\Feed;

use App\Enums\Core\ErrorMessageEnum;
use App\Enums\Core\SwipeActionEnum;
use App\Models\User;
use App\Rules\BaseRule;
use App\Services\User\UserService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

// TODO: maybe we can remove feed_profile checks at all
class CanSwipeProfileRule extends BaseRule
{
    protected string $message = ErrorMessageEnum::VALIDATION_SWIPE_ALREADY_EXISTS->value;

    public function __construct(
        private readonly UserService $userService,
    )
    {

    }

    public function passes($attribute, $value): bool
    {
        if (isset($this->context['respond']) && $this->context['respond'] === true) {
            return true;
        }

        $actionType = SwipeActionEnum::from($this->data['action']);

        if ($actionType === SwipeActionEnum::DISLIKE) {
            return true;
        }

        $isPremium = User::query()
            ->select(['id', 'is_premium'])
            ->where('id', $this->data['user_id'])
            ->firstOrFail()
            ->is_premium;

        $userSwipes = $this->userService->usedSwipes($this->data['user_id']);

        if (
            $actionType === SwipeActionEnum::LIKE
            && $userSwipes['likes'] >= UserService::LIKES_DAY_LIMIT
            && $isPremium === false
        ) {
            $this->message = ErrorMessageEnum::VALIDATION_SWIPES_DAY_LIMIT_REACHED->value;
            return false;
        }

        if (
            $actionType === SwipeActionEnum::SUPERLIKE
            && $userSwipes['superlikes'] >= UserService::SUPERLIKE_DAY_LIMIT
        ) {
            $this->message = ErrorMessageEnum::VALIDATION_SWIPES_DAY_LIMIT_REACHED->value;
            return false;
        }

        $profileExists = DB::table('user_feed_profile')
            ->where('id', (int)$value)
            ->exists();

        if ($profileExists === false) {
            $this->message = ErrorMessageEnum::VALIDATION_USER_DOES_NOT_HAVE_FEED_PROFILE->value;
            return false;
        }

        $currentUserProfile = DB::table('user_feed_profile')
            ->where('user_id', $this->data['user_id'])
            ->exists();

        if ($currentUserProfile === false) {
            $this->message = ErrorMessageEnum::VALIDATION_USER_DOES_NOT_HAVE_FEED_PROFILE->value;
            return false;
        }

        $swipeExists = DB::table('user_swipes')
            ->where('user_id', $this->data['user_id'])
            ->where('profile_id', (int)$value)
            ->exists();

        if ($swipeExists) {
            return false;
        }

        return true;
    }
}
