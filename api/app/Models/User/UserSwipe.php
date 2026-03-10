<?php

namespace App\Models\User;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property $user User
 * @property string $action
 */
class UserSwipe extends Model
{
    protected $table = 'user_swipes';
    protected $fillable = [
        'user_id',
        'profile_id',
        'action',
        'is_match',
        'is_respond'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(UserFeedProfile::class, 'profile_id');
    }
}
