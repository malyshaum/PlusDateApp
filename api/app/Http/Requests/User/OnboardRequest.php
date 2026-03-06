<?php

namespace App\Http\Requests\User;

use App\Enums\Core\EyeColorEnum;
use App\Enums\Core\GenderEnum;
use App\Enums\Core\SearchForEnum;
use App\Http\Requests\BaseRequest;
use App\Rules\User\CanOnboardRule;
use App\Rules\User\CanUpdateProfileRule;
use Illuminate\Validation\Rule;

class OnboardRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                CanUpdateProfileRule::init($this->validationData()),
                CanOnboardRule::init($this->validationData()),
            ],
            'name' => ['required', 'string', 'max:50', 'min:1'],
            'instagram' => ['sometimes', 'string', 'max:100', 'min:1'],
            'profile_description' => ['sometimes', 'string', 'max:255', 'min:1'],
            'language_code' => ['sometimes', 'string'],

            'city_id' => 'required|exists:cities,id',
            'activity_id' => 'sometimes|exists:activities,id',
            'hobbies' => 'sometimes|present|array',
            'hobbies.*' => 'nullable|integer|exists:hobbies,id',
            'height' => 'sometimes|integer|min:1|max:300',
            'eye_color' => [
                'sometimes',
                'string',
                Rule::in(EyeColorEnum::values()),
            ],

            'sex' => [
                'required',
                'string',
                Rule::in(GenderEnum::values())
            ],
            'age' => [
                'required',
                'integer',
                'min:16',
                'max:99'
            ],
            'search_for' => [
                'required',
                'string',
                Rule::in(SearchForEnum::values())
            ],
        ];
    }
}
