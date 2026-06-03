<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityReaction extends Model
{
    use HasFactory;

    protected $fillable = ['message_id', 'user_id', 'emoji'];

    public function message()
    {
        return $this->belongsTo(CommunityMessage::class, 'message_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
