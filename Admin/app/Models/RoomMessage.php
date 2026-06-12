<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomMessage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'room_id', 'user_id', 'parent_id', 'type', 'body',
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

    public function room(): BelongsTo
    {
        return $this->belongsTo(ReadingRoom::class, 'room_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(RoomReaction::class, 'message_id');
    }
}
