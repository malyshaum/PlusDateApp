<?php

use App\Console\Commands\Payment\CheckOneDayTrialSubscriptionCommand;
use App\Console\Commands\User\CleanupDeletedAccountsCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command(CheckOneDayTrialSubscriptionCommand::class)->hourly()->runInBackground();
Schedule::command(CleanupDeletedAccountsCommand::class)->daily()->runInBackground();
