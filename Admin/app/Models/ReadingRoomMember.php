<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingRoomMember extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'room_id', 'user_id', 'role', 'highlight_color',
        'last_page', 'last_active_at', 'joined_at',
    ];

    protected $casts = [
        'last_page'      => 'integer',
        'last_active_at' => 'datetime',
        'joined_at'      => 'datetime',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(ReadingRoom::class, 'room_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
