<?php

namespace App\Dto\User;

use App\Dto\BaseDto;
use App\Enums\Core\SearchForEnum;
use App\Enums\Core\GenderEnum;
use Clickbar\Magellan\Data\Geometries\Point;

class UserFeedProfileDto extends BaseDto
{
    public int|null $id;
    public int $userId;
    public int|null $countryId;
    public int $cityId;
    public GenderEnum $sex;
    public int $age;
    public SearchForEnum|null $searchFor;
    public Point $coordinates;
    public array|null $vector;
    public int|null $height;
    public string|null $eyeColor;
    public int|null $activityId;
    public array|null $hobbies;
}
