<?php

namespace App\Services\User;

use App\Dto\CursorCollectionDto;
use App\Dto\Storage\SaveFileDto;
use App\Dto\User\OnboardDto;
use App\Dto\User\UpdatePhotosDto;
use App\Dto\User\UpsertUserDto;
use App\Dto\User\UserDto;
use App\Dto\User\UserSearchPreferenceDto;
use App\Enums\Core\ErrorMessageEnum;
use App\Enums\Core\FileTypeEnum;
use App\Enums\Core\SwipeActionEnum;
use App\Enums\Moderation\RejectionReasonEnum;
use App\Enums\Payment\SubscriptionTypeEnum;
use App\Enums\Telegram\TelegramMessageEnum;
use App\Exceptions\ApiException;
use App\Jobs\Moderation\ModeratePhotoUpdateJob;
use App\Jobs\Moderation\ValidateUserProfileJob;
use App\Mapping\User\ArrayToUserSearchPreferenceDtoMapper;
use App\Mapping\User\UserToUserDtoMapper;
use App\Models\Chat;
use App\Models\Dictionary\City;
use App\Models\Dictionary\Country;
use App\Models\Moderation\UserModeration;
use App\Models\User;
use App\Models\User\UserFeedProfile;
use App\Models\User\UserFile;
use App\Models\User\UserSearchPreference;
use App\Models\User\UserSettings;
use App\Models\User\UserSwipe;
use App\Services\TelegramService;
use AutoMapperPlus\AutoMapper;
use AutoMapperPlus\Exception\UnregisteredMappingException;
use Exception;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

readonly class UserService
{
    public const int LIKES_SYSTEM_DAY_LIMIT = 9999;
    public const int LIKES_DAY_LIMIT = 10;
    public const int SUPERLIKE_DAY_LIMIT = 2;

    public function __construct(
        private AutoMapper             $mapper,
        private FileService            $userFileService,
        private UserFeedProfileService $userFeedProfileService,
        private TelegramService        $telegramService,
    )
    {

    }

    /**
     * @todo Use mapper for SaveFileDto
     * @throws Exception
     */
    public function upsert(UpsertUserDto $dto): UserDto
    {
        DB::beginTransaction();
        try {
            $user = User::query()->updateOrCreate(['id' => $dto->id], $dto->toArray());

            if (isset($dto->settings)) {
                UserSettings::query()->updateOrCreate(['user_id' => $user->id], $dto->settings->toArray());
            }

            if (!empty($dto->feedProfile)) {
                $this->userFeedProfileService->upsert($dto->feedProfile);
            }

            if (!empty($dto->searchPreference)) {
                UserSearchPreference::query()
                    ->updateOrCreate([
                        'user_id' => $user->id,
                    ], $dto->searchPreference->toArray());
            }

            DB::commit();

            $user->load(['feedProfile','settings']);

            /** @var UserDto $userDto */
            /** @see UserToUserDtoMapper::mapToObject() */
            return $this->mapper->map($user, UserDto::class);
        } catch (Exception $exception) {
            DB::rollBack();
            throw $exception;
        }
    }

    /**
     * @throws Exception
     */
    public function onboardUser(OnboardDto $dto): UserDto|null
    {
        DB::beginTransaction();
        try {
            $user = User::query()->updateOrCreate([
                'id' => $dto->userId
            ], $dto->toArray());

            /** @var City $city */
            $city = City::query()->find($dto->feedProfile->cityId);
            $dto->feedProfile->coordinates = $city->location;

            /** @var Country $country */
            $country = Country::query()
                ->where('country_code', $city->country_code)
                ->first();

            $dto->feedProfile->countryId = $country->id;

            UserFeedProfile::query()->updateOrCreate([
                'user_id' => $user->id
            ],
                $dto->feedProfile->toArray()
            );

            UserSearchPreference::query()->updateOrCreate([
                'user_id' => $user->id
            ],
                $dto->searchPreference->toArray()
            );

            UserSettings::query()->updateOrCreate([
                'user_id' => $user->id
            ],
                $dto->settings->toArray()
            );

            UserFile::query()
                ->where('user_id', $user->id)
                ->update([
                    'is_under_moderation' => true,
                    'is_main' => false
                ]);

            UserFile::query()
                ->where('user_id', $user->id)
                ->orderBy('id')
                ->first()
                ->update(['is_main' => true]);

            DB::commit();

            $userDto = $this->getById($user->id);

            ValidateUserProfileJob::dispatch($userDto)->onQueue('admin-verification');

            return $userDto;
        } catch (Exception $exception) {
            DB::rollBack();
            throw $exception;
        }
    }

    public function getById(int $userId): UserDto|null
    {
        $user = User::query()->withTrashed()->with('feedProfile')->find($userId);
        if ($user === null) {
            return null;
        }

        /** @see UserToUserDtoMapper::mapToObject() */
        return $this->mapper->map($user, UserDto::class);
    }

    /**
     * @throws UnregisteredMappingException
     */
    public function upsertSearchPreference(UserSearchPreferenceDto $preferenceDto): UserSearchPreferenceDto
    {
        if (isset($preferenceDto->userId)) {
            $preferences = UserSearchPreference::query()
                ->updateOrCreate(
                    ['user_id' => $preferenceDto->userId],
                    $preferenceDto->toArray()
                );

            /** @see ArrayToUserSearchPreferenceDtoMapper::mapToObject */
            $preferenceDto = $this->mapper->mapToObject($preferences->toArray(), $preferenceDto);
        }

        $preferences = UserSearchPreference::query()->updateOrCreate([
            'user_id' => $preferenceDto->userId
        ], $preferenceDto->toArray());

        /** @see ArrayToUserSearchPreferenceDtoMapper::mapToObject */
        return $this->mapper->map($preferences->toArray(), UserSearchPreferenceDto::class);
    }

    /**
     * @throws ApiException
     */
    public function getLikes(int $userId, string|null $cursor, bool $onlyMutual = false): CursorCollectionDto
    {
        $userProfileDto = $this->userFeedProfileService->getByUserId($userId);
        if ($userProfileDto === null) {
            throw new ApiException(ErrorMessageEnum::VALIDATION_USER_DOES_NOT_HAVE_FEED_PROFILE);
        }

        $currentUserId = $userId;
        $myProfileId = $userProfileDto->id;

        // Base query to get likes
        $query = UserSwipe::query()
            ->select('user_swipes.*')
            ->where('profile_id', $myProfileId)
            ->whereIn('action', [SwipeActionEnum::LIKE, SwipeActionEnum::SUPERLIKE]);

        // Filter users
        $query->join('users', 'user_swipes.user_id', '=', 'users.id')
            ->where('users.is_under_moderation', false)
            ->where('users.is_onboarded', true)
            ->where('users.deleted_at','=', null);

        // Exclude users that I disliked
        $query->whereNotExists(function ($q) use ($currentUserId) {
            $q->select(DB::raw(1))
                ->from('user_swipes as my_swipes')
                ->join('user_feed_profile as target_profile', 'my_swipes.profile_id', '=', 'target_profile.id')
                ->where('my_swipes.user_id', $currentUserId)
                ->where('my_swipes.action', SwipeActionEnum::DISLIKE)
                ->whereColumn('target_profile.user_id', 'user_swipes.user_id');
        });

        $mutualCheck = function ($q) use ($currentUserId) {
            $q->select(DB::raw(1))
                ->from('user_swipes as my_likes')
                ->join('user_feed_profile as target_profile', 'my_likes.profile_id', '=', 'target_profile.id')
                ->where('my_likes.user_id', $currentUserId)
                ->whereIn('my_likes.action', [SwipeActionEnum::LIKE, SwipeActionEnum::SUPERLIKE])
                ->whereColumn('target_profile.user_id', 'user_swipes.user_id');
        };

        if ($onlyMutual) {
            $query->whereExists($mutualCheck);
        } else {
            $query->whereNotExists($mutualCheck);
        }

        $query->withCount(['user as is_mutual' => function ($q) use ($currentUserId) {
            $q->whereHas('feedProfile.swipesReceived', function ($sub) use ($currentUserId) {
                $sub->where('user_id', $currentUserId)
                    ->whereIn('action', [SwipeActionEnum::LIKE, SwipeActionEnum::SUPERLIKE]);
            });
        }]);

        $query->with(['user.feedProfile', 'user.files', 'user.settings']);

        $paginated = $query->orderBy('id', 'desc')
            ->cursorPaginate(20, ['*'], 'cursor', $cursor);

        $mutualUserIds = collect($paginated->items())
            ->filter(fn($swipe) => $swipe->is_mutual > 0)
            ->pluck('user_id');

        $chats = $mutualUserIds->isNotEmpty()
            ? Chat::getChatsBetweenUserAndOthers($currentUserId, $mutualUserIds->toArray())
            : collect();

        $data = $paginated->getCollection()->map(function ($swipe) use ($chats, $currentUserId) {
            $chat = $chats->first(function ($c) use ($swipe, $currentUserId) {
                return $c->users->contains('id', $swipe->user_id);
            });

            $user = $swipe->user->toArray();

            $shouldHideAge = $swipe->user?->settings?->hide_age ?? false;
            if ($shouldHideAge) {
                unset($user['feed_profile']['age']);
            }

            return [
                ...$swipe->toArray(),
                'is_mutual' => (bool) $swipe->is_mutual,
                'chat' => $chat,
                'user' => [
                    ...$user,
                    'files' => $this->prepareFiles($swipe),
                ]
            ];
        });

        $cursorCollection = new CursorCollectionDto();
        $cursorCollection->data = $data;
        $cursorCollection->cursor = $cursor;
        $cursorCollection->nextCursor = $paginated->nextCursor()?->encode();
        $cursorCollection->prevCursor = $paginated->previousCursor()?->encode();
        $cursorCollection->hasMore = $paginated->hasMorePages();
         $cursorCollection->total = $query->count();

        return $cursorCollection;
    }

    /**
     * @throws UnregisteredMappingException
     */
    public function getSearchPreferenceDto(int $userId): UserSearchPreferenceDto|null
    {
        $preference = UserSearchPreference::query()
            ->with(['city','activity'])
            ->find($userId)?->toArray();

        /** @see ArrayToUserSearchPreferenceDtoMapper::mapToObject */
        return $this->mapper->map($preference, UserSearchPreferenceDto::class);
    }

    /**
     * @throws ApiException
     */
    public function updatePhotos(UpdatePhotosDto $dto): void
    {
        $userDto = $this->getById($dto->userId);

        foreach ($dto->photos as $photoData) {
            DB::beginTransaction();
            try {
                $saveDto = new SaveFileDto();
                $saveDto->userId = $dto->userId;
                $saveDto->file = $photoData['file'];
                $saveDto->fileId = $photoData['file_id'];
                $saveDto->fileType = FileTypeEnum::IMAGE;
                $saveDto->isUnderModeration = true;

                if ($saveDto->fileId !== null) {
                    $isMainPhotoReplaced = UserFile::query()
                        ->where('id', $saveDto->fileId)
                        ->where('user_id', $userDto->id)
                        ->where('is_main', true)
                        ->exists();
                    $saveDto->isMain = $isMainPhotoReplaced;
                }

                $userFile = $this->userFileService->saveFile($saveDto);
                DB::commit();
            }catch (Exception $exception){
                DB::rollBack();
                Log::error($exception->getMessage());
                throw new $exception;
            }
            ModeratePhotoUpdateJob::dispatch($userFile);
        }

        $this->telegramService->sendMessage(
            $userDto->id,
            TelegramMessageEnum::PHOTO_UPDATE_MODERATION_START_MESSAGE
        );
    }

    public function grantSubscription(int $userId, SubscriptionTypeEnum $subscriptionType): void
    {
        $user = User::query()->findOrFail($userId);

        DB::beginTransaction();
        try {
            $endsAt = match($subscriptionType) {
                SubscriptionTypeEnum::ONE_DAY => now()->addDay(),
                SubscriptionTypeEnum::WEEK => now()->addWeek(),
                SubscriptionTypeEnum::MONTH => now()->addMonth(),
                SubscriptionTypeEnum::THREE_MONTH => now()->addMonths(3),
            };

            DB::table('subscriptions')->insert([
                'user_id' => $userId,
                'type' => $subscriptionType->value,
                'stripe_id' => 'telegram_stars_' . uniqid(),
                'stripe_status' => 'active',
                'stripe_price' => null,
                'quantity' => 1,
                'trial_ends_at' => null,
                'ends_at' => $endsAt,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $user->is_premium = true;
            $user->save();

            DB::commit();

            Log::info('Subscription successfully granted', [
                'user_id' => $userId,
                'type' => $subscriptionType->value,
                'ends_at' => $endsAt
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to grant subscription', [
                'user_id' => $userId,
                'type' => $subscriptionType->value,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * TODO: This method should be in admin service this is only for second moderation flow
     * @throws ApiException
     */
    public function updateFiles(array $filesToSave): void
    {
        DB::beginTransaction();
        try {
            /** @var SaveFileDto $fileData */
            foreach ($filesToSave as $fileData) {

                if ($fileData->fileId !== null) {
                    $userFile = UserFile::query()->select('is_main')->where('id', $fileData->fileId)->first();
                    if ($userFile && $userFile->is_main === true) {
                        $fileData->isMain = true;
                    }
                }

                $fileData->deleteParent = true;

                $this->userFileService->saveFile($fileData);
            }

            UserModeration::query()
                ->where('user_id', $fileData->userId)
                ->where('rejection_reason', RejectionReasonEnum::DECLINED_BY_ADMIN)
                ->update(['is_resolved' => true]);

            DB::commit();
        } catch (Exception $exception) {
            DB::rollBack();
            Log::error($exception->getMessage());
            throw new $exception;
        }
    }

    public function setMainPhoto(int $photoId, int $userId): void
    {
        DB::beginTransaction();
        try {
            UserFile::query()
                ->where('user_id', $userId)
                ->where('type', FileTypeEnum::IMAGE)
                ->where('is_main', true)
                ->update(['is_main' => false]);

            UserFile::query()
                ->where('id', $photoId)
                ->where('user_id', $userId)
                ->where('type', FileTypeEnum::IMAGE)
                ->update(['is_main' => true]);
            DB::commit();
        }   catch (Exception $exception) {
            DB::rollBack();
            Log::error($exception->getMessage());
        }
    }

    public function getMatchCount(int $userId): int
    {
        return UserSwipe::query()
            ->where('user_id', $userId)
            ->where('is_match', true)
            ->count();
    }

    public function usedSwipes(int $userId): array
    {
        $userDto = $this->getById($userId);

        $result = DB::table('user_swipes')
            ->where('user_id', $userId)
            ->whereDate('created_at', Carbon::today())
            ->selectRaw('
                COUNT(CASE WHEN action = ? THEN 1 END) as likes,
                COUNT(CASE WHEN action = ? THEN 1 END) as superlikes
            ',[SwipeActionEnum::LIKE->value,SwipeActionEnum::SUPERLIKE->value])
            ->first();

        // TODO: make dto
        $result = [
            'likes' => $result->likes,
            'superlikes' => $result->superlikes,
            'likes_day_limit' => self::LIKES_DAY_LIMIT,
            'superlikes_day_limit' => $userDto->isPremium ? self::SUPERLIKE_DAY_LIMIT : 0,
        ];

        if ($userDto->isPremium === true) {
            $result['likes_day_limit'] = self::LIKES_SYSTEM_DAY_LIMIT;
        }

        return $result;
    }

    // TODO: should be moved to FilesService
    private function prepareFiles(UserSwipe $swipe): array
    {
        $userFiles = $swipe->user->validFiles;

        // TODO: remove auth facade
        $isUserPremium = Auth::user()->is_premium;

        return $userFiles->map(function (UserFile $file) use($isUserPremium, $swipe) {
            $data = $file->toArray();

            if ($swipe->action != SwipeActionEnum::SUPERLIKE->value) {
                if ($file->type === FileTypeEnum::VIDEO->value) {
                    $thumbnail = Str::replace('.mp4','.webp', basename($file->filepath));

                    if ($isUserPremium === false) {
                        $thumbnail = 'blurred_'.$thumbnail;
                    }

                    $data['thumbnail_url'] = Storage::temporaryUrl(
                        Str::replace(basename($file->filepath),$thumbnail, $file->filepath),
                        Carbon::now()->addDay()
                    );
                }

                if ($file->type === FileTypeEnum::IMAGE->value && $isUserPremium === false) {
                    $filename = 'blurred_'.basename($file->filepath);
                    $data['url'] = Storage::temporaryUrl(
                        Str::replace(basename($file->filepath), $filename, $file->filepath),
                        Carbon::now()->addDay()
                    );
                }
            }

            return $data;
        })->toArray();
    }
}
