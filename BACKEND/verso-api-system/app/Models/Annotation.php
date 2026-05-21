<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Annotation extends Model
{
    protected $fillable = [
        'user_id',
        'book_id',
        'page_index',
        'column',
        'start_offset',
        'end_offset',
        'selected_text',
        'note',
        'color',
    ];

    protected $casts = [
        'page_index'   => 'integer',
        'start_offset' => 'integer',
        'end_offset'   => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }
}
