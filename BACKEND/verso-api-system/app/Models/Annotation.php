<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Annotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'book_id',
        'upload_id',
        'file_hash',
        'page_index',
        'column',
        'start_offset',
        'end_offset',
        'selected_text',
        'note',
        'color',
        'location',
    ];

    protected $casts = [
        'page_index'   => 'integer',
        'start_offset' => 'integer',
        'end_offset'   => 'integer',
        'location'     => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function upload()
    {
        return $this->belongsTo(UserUpload::class, 'upload_id');
    }
}
