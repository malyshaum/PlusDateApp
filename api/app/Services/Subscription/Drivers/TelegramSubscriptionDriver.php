<?php

namespace App\Services\Subscription\Drivers;

use App\Enums\Payment\SubscriptionTypeEnum;
use App\Models\Subscription\TelegramSubscription;
use App\Models\User;
use App\Services\Subscription\Contracts\SubscriptionDriver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class TelegramSubscriptionDriver implements SubscriptionDriver
{
    public function subscribe(User $user, SubscriptionTypeEnum $plan): void
    {
        $untilAt = Carbon::now();

        switch ($plan) {
            case SubscriptionTypeEnum::MONTH:
                $untilAt->addMonth();
                break;
            case SubscriptionTypeEnum::WEEK:
                $untilAt->addWeek();
                break;
            case SubscriptionTypeEnum::ONE_DAY:
                $untilAt->addDay();
                break;
            case SubscriptionTypeEnum::THREE_MONTH:
                $untilAt->addMonths(3);
                break;
        }

        TelegramSubscription::query()->updateOrCreate(
            ['user_id' => $user->id, 'plan' => $plan],
            ['active_until' => $untilAt->endOfDay()]
        );
    }

    public function cancel(User $user): void
    {
        TelegramSubscription::query()
            ->where('user_id', $user->id)
            ->update(['active_until' => now()]);
    }

    public function isActive(User $user, SubscriptionTypeEnum $plan): bool
    {
        return TelegramSubscription::query()
            ->where('user_id', $user->id)
            ->where('plan', $plan)
            ->where('active_until', '>', now())
            ->exists();
    }

    public function current(User $user): Model|null
    {
        return TelegramSubscription::query()
            ->where('user_id', $user->id)
            ->where('active_until', '>', now())
            ->latest()
            ->first();
    }
}
