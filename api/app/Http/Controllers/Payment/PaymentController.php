<?php

namespace App\Http\Controllers\Payment;

use App\Enums\Payment\SubscriptionTypeEnum;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Subscription\SubscriptionManager;
use App\Services\TelegramService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Enums\Core\ErrorMessageEnum;

class PaymentController extends Controller
{
    public function __construct(
        private readonly TelegramService $telegramService,
        private readonly SubscriptionManager $subscriptionManager,
    )
    {

    }

    public function currentSubscription(): Response|JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        return $this->response([
            'telegram' => $this->subscriptionManager->driver('telegram')->current($user)?->toArray(),
            'stripe' => $this->subscriptionManager->driver('stripe')->current($user)?->toArray(),
        ]);
    }

    /**
     * @todo Move all business logic inside according service + form request
     * @throws ApiException
     */
    public function subscribe(Request $request): Response|JsonResponse
    {
        $request->validate([
            'range' => [
                'required',
                'string',
                Rule::in(SubscriptionTypeEnum::values()),
            ]
        ]);

        /** @var User $user */
        $user = Auth::user();

        $range = $request->input('range');
        $redirectUrl = config('cashier.redirect_url').'?startapp=';

        if ($range === 'one_day') {

            if ($user->is_trial_used) {
                throw new ApiException(ErrorMessageEnum::VALIDATION_TRIAL_ALREADY_USED, 400);
            }

            DB::beginTransaction();
            try {
                $user = User::query()->where('id', $user->id)->firstOrFail();

                $this->subscriptionManager
                    ->driver('telegram')
                    ->subscribe($user, SubscriptionTypeEnum::ONE_DAY);

                $user->update(['is_premium' => true, 'is_trial_used' => true]);

                DB::commit();
            } catch (Exception $exception) {
                DB::rollBack();
                throw new ApiException(ErrorMessageEnum::APP_PAYMENT_ERROR);
            }

            return $this->response();
        }

        $prices = config('cashier.price_ids');
        $currentPrice = $prices[$range];


        /** @var User $user */
        $user = Auth::user();

        $checkout = $user->newSubscription($range, $currentPrice)
            ->withMetadata([
                'range' => $range,
                'user_id' => $user->id,
            ])
            ->checkout([
                'success_url' => $redirectUrl.'payment_success',
                'cancel_url' => $redirectUrl.'payment_error'
            ]);

        return $this->response([
            'url' => $checkout->url,
        ]);
    }

    public function cancel(): Response|JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $this->subscriptionManager->driver('stripe')->cancel($user);
        $this->subscriptionManager->driver('telegram')->cancel($user);

        return $this->response();
    }

    /**
     * @throws ApiException
     */
    public function sendTelegramInvoice(Request $request): Response|JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $request->validate([
            'range' => [
                'required',
                'string',
                Rule::in(SubscriptionTypeEnum::values()),
            ]
        ]);

        return $this->response([
            'url' => $this->telegramService->createInvoiceLink(
                $user->id,
                SubscriptionTypeEnum::from($request->input('range')),
            )
        ]);
    }
}
