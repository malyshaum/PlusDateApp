<?php

namespace App\Services\Moderation;

use App\Clients\ImmagaClient;
use App\Dto\User\UserDto;
use App\Enums\Core\ErrorMessageEnum;
use App\Enums\Core\FileTypeEnum;
use App\Enums\Moderation\RejectionReasonEnum;
use App\Events\Moderation\ModerationStatusUpdatedEvent;
use App\Exceptions\ApiException;
use App\Models\Moderation\UserModeration;
use App\Models\User\UserFile;
use Exception;
use FFMpeg\Coordinate\TimeCode;
use FFMpeg\FFMpeg;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ModerationService
{
    private const int MINIMUM_ACCEPTED_CONFIDENCE_LEVEL = 60;
    private const int MINIMUM_ACCEPTED_FACE_SIMILARITY_LEVEL = 50;

    public function __construct(
        private readonly ImmagaClient $immagaClient,
    )
    {

    }

    /**
     * @throws ApiException
     * @throws Exception
     */
    public function isRequirementsMet(UserDto $userDto): bool
    {
        $userPhotos = UserFile::query()
            ->where('user_id', $userDto->id)
            ->whereIn('type', [FileTypeEnum::IMAGE,FileTypeEnum::VERIFICATION_PHOTO])
            ->orderBy('created_at', 'desc')
            ->limit(4)
            ->get();

        /** @var UserFile $verificationPhoto */
        $verificationPhoto = $userPhotos->where('type', FileTypeEnum::VERIFICATION_PHOTO)->first();
        if ($verificationPhoto === null) {
            throw new ApiException(ErrorMessageEnum::ERROR_NO_VERIFICATION_PHOTO);
        }

        $faceId = $this->immagaClient->getFaceIdFromImage($verificationPhoto->filepath);

        if ($faceId === null) {
            UserModeration::query()->create([
                'user_id' => $userDto->id,
                'rejection_reason' => RejectionReasonEnum::FACE_FROM_VERIFICATION_PHOTO_NOT_FOUND,
                'is_resolved' => false,
                'user_file_id' => $verificationPhoto->id,
            ]);

            ModerationStatusUpdatedEvent::dispatch($userDto, RejectionReasonEnum::FACE_FROM_VERIFICATION_PHOTO_NOT_FOUND);
            return false;
        }


        /** @var UserFile $photo */
        foreach ($userPhotos as $photo) {

            $confidence = $this->immagaClient->compareFaces($faceId, $photo->filepath);

            if ($confidence < self::MINIMUM_ACCEPTED_FACE_SIMILARITY_LEVEL) {
                Log::debug('[ModerationService] face from verification photo not found: ', [
                    'filepath' => $photo->filepath
                ]);

                UserModeration::query()->create([
                    'user_id' => $userDto->id,
                    'rejection_reason' => RejectionReasonEnum::FACE_FROM_VERIFICATION_PHOTO_NOT_FOUND,
                    'is_resolved' => false,
                    'user_file_id' => $photo->id,
                ]);

                ModerationStatusUpdatedEvent::dispatch($userDto, RejectionReasonEnum::FACE_FROM_VERIFICATION_PHOTO_NOT_FOUND);
                return false;
            }

            $confidence = $this->immagaClient->getNSFWConfidence($photo->filepath);
            if ($confidence > self::MINIMUM_ACCEPTED_CONFIDENCE_LEVEL) {
                Log::debug('[ModerationService] detected NSFW: ', ['filepath' => $photo->filepath]);

                UserModeration::query()->create([
                    'user_id' => $userDto->id,
                    'rejection_reason' => RejectionReasonEnum::NSFW_CONTENT,
                    'is_resolved' => false,
                    'user_file_id' => $photo->id,
                ]);

                ModerationStatusUpdatedEvent::dispatch($userDto, RejectionReasonEnum::NSFW_CONTENT);
                return false;
            }
        }

        ModerationStatusUpdatedEvent::dispatch($userDto, null);
        return true;
    }

    // TODO: replace with dto
    public function checkPhoto(UserFile $userFile): UserModeration|null
    {
        $verificationPhoto = UserFile::query()
            ->where('user_id', $userFile->user_id)
            ->where('type', FileTypeEnum::VERIFICATION_PHOTO)
            ->first();

        try {
            $nsfwConf = $this->immagaClient->getNSFWConfidence($userFile->filepath);
            if ($nsfwConf > self::MINIMUM_ACCEPTED_CONFIDENCE_LEVEL) {
                Log::debug('[ModerationService] detected NSFW: ', [
                    'filepath' => $userFile->filepath
                ]);

                return UserModeration::query()->create([
                    'user_id' => $userFile->user_id,
                    'rejection_reason' => RejectionReasonEnum::USER_PROFILE_PHOTO_NSFW_CONTENT,
                    'is_resolved' => false,
                    'user_file_id' => $userFile->id,
                ]);
            }

            $faceConf = $this->immagaClient->getFaceConfidence($userFile->filepath);
            if ($faceConf < self::MINIMUM_ACCEPTED_CONFIDENCE_LEVEL) {
                Log::debug('[ModerationService] face not detected: ', [
                    'filepath' => $userFile->filepath
                ]);

                return UserModeration::query()->create([
                    'user_id' => $userFile->user_id,
                    'rejection_reason' => RejectionReasonEnum::USER_PROFILE_PHOTO_FACE_NOT_DETECTED,
                    'is_resolved' => false,
                    'user_file_id' => $userFile->id,
                ]);
            }

            $faceId = $this->immagaClient->getFaceIdFromImage($verificationPhoto->filepath);
            if ($faceId === null) {
                return UserModeration::query()->create([
                    'user_id' => $userFile->user_id,
                    'rejection_reason' => RejectionReasonEnum::USER_PROFILE_PHOTO_FACE_FROM_VERIFICATION_PHOTO_NOT_FOUND,
                    'is_resolved' => false,
                    'user_file_id' => $userFile->id,
                ]);
            }

            $compareConf = $this->immagaClient->compareFaces($faceId, $userFile->filepath);

            if ($compareConf < self::MINIMUM_ACCEPTED_FACE_SIMILARITY_LEVEL) {
                Log::debug('[ModerationService] face from verification photo not detected: ', [
                    'filepath' => $userFile->filepath
                ]);

                return UserModeration::query()->create([
                    'user_id' => $userFile->user_id,
                    'rejection_reason' => RejectionReasonEnum::USER_PROFILE_PHOTO_FACE_FROM_VERIFICATION_PHOTO_NOT_FOUND,
                    'is_resolved' => false,
                    'user_file_id' => $userFile->id,
                ]);
            }
        } catch (Exception $e) {
            Log::error($e->getMessage());

            return UserModeration::query()->create([
                'user_id' => $userFile->user_id,
                'rejection_reason' => RejectionReasonEnum::USER_PROFILE_PHOTO_INTERNAL_ERROR,
                'is_resolved' => false,
                'user_file_id' => $userFile->id,
            ]);
        }

        return null;
    }
}
