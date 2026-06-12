<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id', 'inviter_id', 'invitee_id', 'status',
    ];

    public function room()
    {
        return $this->belongsTo(ReadingRoom::class, 'room_id');
    }

    public function inviter()
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    public function invitee()
    {
        return $this->belongsTo(User::class, 'invitee_id');
    }
}
