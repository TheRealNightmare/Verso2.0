<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomAnnotationComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_annotation_id', 'user_id', 'body',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function annotation()
    {
        return $this->belongsTo(RoomAnnotation::class, 'room_annotation_id');
    }
}
