<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReadingRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id', 'owner_id', 'type', 'name', 'description',
        'visibility', 'join_code', 'member_count',
    ];

    protected $casts = [
        'member_count' => 'integer',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function members()
    {
        return $this->hasMany(ReadingRoomMember::class, 'room_id');
    }

    public function annotations()
    {
        return $this->hasMany(RoomAnnotation::class, 'room_id');
    }

    public function messages()
    {
        return $this->hasMany(RoomMessage::class, 'room_id');
    }

    public function isMember(int $userId): bool
    {
        return $this->members()->where('user_id', $userId)->exists();
    }

    public function memberFor(int $userId): ?ReadingRoomMember
    {
        return $this->members()->where('user_id', $userId)->first();
    }
}
