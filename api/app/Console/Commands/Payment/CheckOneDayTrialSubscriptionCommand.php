<?php

namespace App\Console\Commands\Payment;

use App\Models\User;
use App\Services\Subscription\SubscriptionManager;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

class CheckOneDayTrialSubscriptionCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-one-day-trial-subscription';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle(
        SubscriptionManager $subscriptionManager,
    ): void
    {
        $this->info('starting app:check-one-day-trial-subscription command');

        User::query()
            ->where('is_premium', true)
            ->chunk(100, function (Collection $users) use ($subscriptionManager) {
                $users->each(function (User $user) use ($subscriptionManager) {
                    $this->info('processing user ' . $user->id);
                    $stripeSubscription = $subscriptionManager->driver('stripe')->current($user);
                    $telegramSubscription = $subscriptionManager->driver('telegram')->current($user);
                    if ($stripeSubscription === null && $telegramSubscription === null) {
                        $user->update(['is_premium' => false]);
                        $this->info('user ' . $user->id . ' not subscribed');
                    } else {
                        $this->info('user ' . $user->id . ' still subscribed');
                    }
                });
            });

        $this->info('finished app:check-one-day-trial-subscription command');
    }
}
