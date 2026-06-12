<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReadingRoom extends Model
{
    protected $fillable = [
        'book_id', 'owner_id', 'type', 'name', 'description',
        'visibility', 'join_code', 'member_count',
    ];

    protected $casts = [
        'member_count' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ReadingRoomMember::class, 'room_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(RoomMessage::class, 'room_id');
    }
}
