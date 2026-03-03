<?php

namespace App\Http\Controllers\Bot;

use App\Dto\User\UserDto;
use App\Enums\Payment\PaymentStatusEnum;
use App\Enums\Payment\PaymentTypeEnum;
use App\Enums\Payment\SubscriptionTypeEnum;
use App\Enums\Telegram\TelegramMessageEnum;
use App\Http\Controllers\Controller;
use App\Models\Subscription\Transaction;
use App\Models\User;
use App\Services\Subscription\SubscriptionManager;
use App\Services\TelegramService;
use App\Services\User\UserService;
use AutoMapperPlus\AutoMapper;
use AutoMapperPlus\Exception\UnregisteredMappingException;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Laravel\Facades\Telegram;
use GuzzleHttp\Psr7\Request as Psr7Request;

class TelegramBotController extends Controller
{
    public function __construct(
        private readonly TelegramService $telegramService,
        private readonly SubscriptionManager $subscriptionManager,
    )
    {

    }

    // TODO: use jobs
    public function webhook(Request $request): JsonResponse
    {
        try {
            Log::debug('telegram webhook: ', $request->all());

            if ($request->has('pre_checkout_query')) {
                $this->handlePreCheckout($request->input('pre_checkout_query'));
                return response()->json(['status' => 'ok']);
            }

            if ($request->has('message.successful_payment')) {
                $this->handleSuccessfulPayment($request->input('message'));
                return response()->json(['status' => 'ok']);
            }

            Telegram::commandsHandler(true, new Psr7Request(
                $request->method(),
                $request->fullUrl(),
                $request->headers->all(),
                $request->getContent()
            ));
            return response()->json(['status' => 'ok']);
        } catch (Exception $e) {
            Log::error('Telegram webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_body' => $request->all()
            ]);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * @throws UnregisteredMappingException
     * @throws Exception
     */
    public function moderationWebhook(Request $request): void
    {
        $update = $request->all();
        $this->telegramService->processAdminWebhook($update);
    }

    private function handlePreCheckout(array $preCheckoutQuery): void
    {
        $botToken = config('services.telegram.client_secret');
        $queryId = $preCheckoutQuery['id'];

        try {
            $payload = json_decode($preCheckoutQuery['invoice_payload'], true);

            Http::post("https://api.telegram.org/bot{$botToken}/answerPreCheckoutQuery", [
                'pre_checkout_query_id' => $queryId,
                'ok' => true,
            ]);

            Log::info('Pre-checkout query approved', [
                'query_id' => $queryId,
                'payload' => $payload
            ]);
        } catch (Exception $e) {
            Http::post("https://api.telegram.org/bot{$botToken}/answerPreCheckoutQuery", [
                'pre_checkout_query_id' => $queryId,
                'ok' => false,
                'error_message' => 'Payment processing error. Please try again.'
            ]);

            Log::error('Pre-checkout query failed', [
                'query_id' => $queryId,
                'error' => $e->getMessage()
            ]);
        }
    }

    private function handleSuccessfulPayment(array $message): void
    {
        DB::beginTransaction();
        try {
            $payment = $message['successful_payment'];
            $payload = json_decode($payment['invoice_payload'], true);

            $userId = $payload['user_id'];
            $subscriptionType = SubscriptionTypeEnum::from($payload['range']);

            $user = User::query()->findOrFail($userId);

            $this->subscriptionManager
                ->driver('telegram')
                ->subscribe($user, $subscriptionType);

            $user->update(['is_premium' => true]);

            Transaction::query()->create([
                    'user_id' => $userId,
                    'external_id' => $payment['telegram_payment_charge_id'],
                    'amount' => $payment['total_amount'],
                    'currency' => $payment['currency'],
                    'type' => PaymentTypeEnum::TELEGRAM,
                    'metadata' => $message,
                    'status' => PaymentStatusEnum::SUCCESS,
                ]);

            DB::commit();

            Log::info('Subscription granted', [
                'user_id' => $userId,
                'type' => $subscriptionType->value,
                'stars_paid' => $payment['total_amount'],
                'telegram_payment_charge_id' => $payment['telegram_payment_charge_id'] ?? null
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to process successful payment', [
                'error' => $e->getMessage(),
                'payment' => $message['successful_payment'] ?? null
            ]);
        }
    }
}
