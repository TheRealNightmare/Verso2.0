<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommunityMessage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'parent_id', 'type', 'body',
        'audio_path', 'duration_sec', 'image_path', 'edited_at',
        'is_spoiler', 'spoiler_source', 'spoiler_checked_at',
    ];

    protected $casts = [
        'edited_at'          => 'datetime',
        'is_spoiler'         => 'boolean',
        'spoiler_checked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
