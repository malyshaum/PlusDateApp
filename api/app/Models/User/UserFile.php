<?php

namespace App\Models\User;

use App\Models\Moderation\UserModeration;
use App\Models\User;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $user_id
 * @property int $file_id
 * @property bool $is_under_moderation
 * @property bool $is_main
 * @property string $filepath
 * @property string $url
 * @property string $type
 * @property Carbon $created_at
 */
class UserFile extends Model
{
    use SoftDeletes;

    protected $table = 'user_files';

    protected $fillable = [
        'user_id',
        'filepath',
        'type',
        'file_id',
        'is_under_moderation',
        'is_main',
    ];

    protected $appends = ['url'];

    public function url(): Attribute
    {
        return new Attribute(
            get: fn () => Storage::temporaryUrl($this->filepath, Carbon::now()->addDay()),
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function file(): HasOne
    {
        return $this->hasOne(UserFile::class, 'file_id', 'id');
    }

    public function moderation(): HasMany
    {
        return $this->hasMany(UserModeration::class, 'user_file_id', 'id');
    }
}
