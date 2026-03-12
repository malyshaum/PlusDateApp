<?php

namespace App\Services\Subscription;

use App\Services\Subscription\Contracts\SubscriptionDriver;
use App\Services\Subscription\Drivers\StripeSubscriptionDriver;
use App\Services\Subscription\Drivers\TelegramSubscriptionDriver;
use InvalidArgumentException;

final readonly class SubscriptionManager
{
    public function __construct(
        private StripeSubscriptionDriver $stripe,
        private TelegramSubscriptionDriver $telegram,
    ) {}

    public function driver(string $type): SubscriptionDriver
    {
        return match ($type) {
            'stripe' => $this->stripe,
            'telegram' => $this->telegram,
            default => throw new InvalidArgumentException("Unknown driver: {$type}"),
        };
    }
}
