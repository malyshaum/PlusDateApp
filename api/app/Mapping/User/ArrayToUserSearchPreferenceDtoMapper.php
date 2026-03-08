<?php

namespace App\Mapping\User;

use App\Dto\User\UserSearchPreferenceDto;
use App\Enums\Core\GenderEnum;
use App\Enums\Core\SearchForEnum;
use App\Enums\Core\EyeColorEnum;
use App\Services\Dictionary\DictionaryService;
use App\Services\User\UserService;
use AutoMapperPlus\CustomMapper\CustomMapper;
use AutoMapperPlus\Exception\UnregisteredMappingException;

class ArrayToUserSearchPreferenceDtoMapper extends CustomMapper
{
    public function __construct(
        private readonly UserService $userService,
        private readonly DictionaryService $dictionaryService,
    ) {
    }

    /**
     * @param array $source
     * @param UserSearchPreferenceDto $destination
     * @throws UnregisteredMappingException
     */
    public function mapToObject($source, $destination): UserSearchPreferenceDto
    {
        $destination = $this->userService->getSearchPreferenceDto($source['user_id']);
        if ($destination === null) {
            $destination = new UserSearchPreferenceDto();
        }

        if (isset($source['id'])) {
            $destination->id = $source['id'];
        }

        if (isset($source['user_id'])) {
            $destination->userId = $source['user_id'];
        }

        if (isset($source['city_id'])) {
            $destination->cityId = $source['city_id'];
        }

        if (isset($source['include_nearby'])) {
            $destination->includeNearby = $source['include_nearby'];
        }

        if (isset($source['from_age'])) {
            $destination->fromAge = $source['from_age'];
        }

        if (isset($source['to_age'])) {
            $destination->toAge = $source['to_age'];
        }

        if (isset($source['expand_age_range'])) {
            $destination->expandAgeRange = $source['expand_age_range'];
        }

        if (isset($source['gender'])) {
            $destination->gender = GenderEnum::tryFrom($source['gender']);
        }

        if (isset($source['search_for'])) {
            $destination->searchFor = SearchForEnum::tryFrom($source['search_for']);
        }

        if (isset($source['eye_color'])) {
            foreach ($source['eye_color'] as $eyeColor) {
                $destination->eyeColor[] = EyeColorEnum::tryFrom($eyeColor)->value;
            }
        }

        if (isset($destination->cityId)) {
            $destination->city = $this->dictionaryService->getCityById($destination->cityId);
            $destination->country = $this->dictionaryService->getCountryByCode($destination->city->countryCode);
        }

        if (isset($source['hobbies'])) {
            $destination->hobbies = $source['hobbies'];
        }

        if (isset($source['height_from'])) {
            $destination->heightFrom = $source['height_from'];
        }

        if (isset($source['height_to'])) {
            $destination->heightTo = $source['height_to'];
        }

        if (isset($source['activity_id'])) {
            $destination->activityId = $source['activity_id'];
        }

        if (isset($source['with_video'])) {
            $destination->withVideo = $source['with_video'];
        }

        if (isset($source['with_premium'])) {
            $destination->withPremium = $source['with_premium'];
        }

        if (isset($destination->activityId)) {
            $destination->activity = $this->dictionaryService->getActivityById($destination->activityId);
        }

        return $destination;
    }
}
