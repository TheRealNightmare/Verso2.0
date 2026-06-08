<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomAnnotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id', 'user_id', 'book_id', 'page_index', 'column',
        'start_offset', 'end_offset', 'selected_text', 'note',
        'color', 'comment_count',
    ];

    protected $casts = [
        'page_index'    => 'integer',
        'start_offset'  => 'integer',
        'end_offset'    => 'integer',
        'comment_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function room()
    {
        return $this->belongsTo(ReadingRoom::class, 'room_id');
    }

    public function comments()
    {
        return $this->hasMany(RoomAnnotationComment::class, 'room_annotation_id');
    }
}
