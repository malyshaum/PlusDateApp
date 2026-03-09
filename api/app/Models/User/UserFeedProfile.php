<?php

namespace App\Models\User;

use App\Enums\Core\SearchForEnum;
use App\Models\Dictionary\Activity;
use App\Models\Dictionary\City;
use App\Models\Dictionary\Country;
use App\Models\User;
use Clickbar\Magellan\Data\Geometries\Point;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $activity_id
 * @property int $id
 * @property int $height
 */
class UserFeedProfile extends Model
{
    use HasFactory;

    protected $table = 'user_feed_profile';
    protected $fillable = [
        'user_id',
        'country_id',
        'city_id',
        'sex',
        'age',
        'search_for',
        'coordinates',
        'vector',
        'activity_id',
        'height',
        'eye_color',
        'hobbies',
    ];

    protected $casts = [
        'coordinates' => Point::class,
        'search_for' => SearchForEnum::class,
        'vector' => 'array',
        'hobbies' => 'array',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function swipesReceived(): HasMany
    {
        return $this->hasMany(UserSwipe::class, 'profile_id');
    }
}
