<?php

namespace App\Enums\Payment;

use App\Enums\BaseEnumTrait;

enum SubscriptionTypeEnum: string
{
    use BaseEnumTrait;

    case ONE_DAY = 'one_day';
    case WEEK = 'week';
    case MONTH = 'month';
    case THREE_MONTH = 'three_month';
}
