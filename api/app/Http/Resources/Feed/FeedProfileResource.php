<?php

namespace App\Http\Resources\Feed;

use App\Enums\Core\FileTypeEnum;
use App\Http\Resources\User\UserFeedProfileResource;
use App\Models\User;
use App\Models\User\UserFile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FeedProfileResource extends JsonResource
{
    public function toArray($request): array
    {
        /** @var User $this */
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'photo_url' => $this->photo_url,
            'language_code' => $this->language_code,
            'is_onboarded' => $this->is_onboarded,
            'is_under_moderation' => $this->is_under_moderation,
            'instagram' => $this->instagram,
            'profile_description' => $this->profile_description,
            'feed_profile' => UserFeedProfileResource::make($this->whenLoaded('feedProfile')),
            'is_premium' => $this->is_premium,
            'files' => self::prepareFiles(),
        ];

        if ($this->settings !== null) {
            if ($this->settings->hide_instagram) {
                $data['instagram'] = null;
            }

            if ($this->settings->hide_age && isset($data['feed_profile'])) {
                $data['feed_profile']['age'] = null;
            }
        }

        return $data;
    }

    private function prepareFiles(): array
    {
        /** @var User $this  */
        /** @var Collection $userFiles */
        $userFiles = $this->validFiles;

        return $userFiles->map(function (UserFile $file) {
            $data = $file->toArray();

            if ($file->type === FileTypeEnum::VIDEO->value) {
                $thumbnail = Str::replace('.mp4','.webp', basename($file->filepath));

                if (Auth::user()->is_premium === false) {
                    $thumbnail = 'blurred_'.$thumbnail;
                }

                $data['thumbnail_url'] = Storage::temporaryUrl(
                    Str::replace(basename($file->filepath), $thumbnail, $file->filepath),
                    Carbon::now()->addDay()
                );
            }

            return $data;
        })->toArray();
    }
}
