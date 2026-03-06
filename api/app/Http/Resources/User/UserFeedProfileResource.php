<?php

namespace App\Http\Resources\User;

use App\Http\Resources\Dictionary\CityResource;
use App\Models\Dictionary\Hobby;
use App\Models\User\UserFeedProfile;
use Illuminate\Http\Resources\Json\JsonResource;

class UserFeedProfileResource extends JsonResource
{
    // TODO: remove hobbies query builder here
    public function toArray($request): array
    {
        /** @var UserFeedProfile $this */
        return [
            'id' => $this->id,
            'city' => CityResource::make($this->city),
            'sex' => $this->sex,
            'age' => $this->age,
            'search_for' => $this->search_for,
            'coordinates' => [
                $this->coordinates->getLatitude(),
                $this->coordinates->getLongitude(),
            ],
            'activity' => $this->activity,
            'height' => $this->height,
            'eye_color' => $this->eye_color,
            'hobbies' => empty($this->hobbies) ? [] : Hobby::query()->whereIn('id', $this->hobbies)->get(),
        ];
    }
}
