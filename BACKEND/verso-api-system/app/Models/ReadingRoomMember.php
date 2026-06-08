<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReadingRoomMember extends Model
{
    use HasFactory;

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

    public function room()
    {
        return $this->belongsTo(ReadingRoom::class, 'room_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
