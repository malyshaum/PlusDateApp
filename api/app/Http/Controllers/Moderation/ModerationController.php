<?php

namespace App\Http\Controllers\Moderation;

use App\Dto\Storage\SaveFileDto;
use App\Enums\Telegram\TelegramMessageEnum;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateFilesRequest;
use App\Jobs\Moderation\ValidateUserProfileJob;
use App\Jobs\Telegram\SendBotMessageJob;
use App\Services\Moderation\ModerationService;
use App\Services\User\UserService;
use AutoMapperPlus\AutoMapper;
use AutoMapperPlus\Exception\InvalidArgumentException;
use AutoMapperPlus\Exception\UnregisteredMappingException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class ModerationController extends Controller
{
    public function __construct(
        private readonly AutoMapper $mapper,
        private readonly UserService $userService,
        private readonly ModerationService $moderationService,
    )
    {

    }

    public function validateUserProfilePhotos(Request $request): Response|JsonResponse
    {
        $request->validate([
            'user_id' => 'required|numeric|gt:0',
        ]);

        $userDto = $this->userService->getById($request->input('user_id'));
        $this->moderationService->isRequirementsMet($userDto);

        return $this->response($userDto);
    }

    /**
     * @throws InvalidArgumentException
     * @throws ApiException
     */
    public function updateFilesWithModeration(UpdateFilesRequest $request): JsonResponse
    {
        /** @see UserMapping::arrayToSaveFileDto */
        $data = $this->mapper->mapMultiple(
            $request->validated()['files'],
            SaveFileDto::class,
            ['user_id' => Auth::id()]
        );

        $this->userService->updateFiles($data);

        $userDto = $this->userService->getById(Auth::id());

        SendBotMessageJob::dispatch($userDto, TelegramMessageEnum::MODERATION_BEGIN_MESSAGE);
        ValidateUserProfileJob::dispatch($userDto)->onQueue('admin-verification');

        return $this->response();
    }
}
