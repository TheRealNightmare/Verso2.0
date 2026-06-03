<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReadingHistory extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'book_id', 'user_upload_id', 'progress', 'current_page', 'last_read_at'];

    protected $casts = [
        'last_read_at' => 'datetime',
        'progress' => 'int',
        'current_page' => 'int',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function userUpload()
    {
        return $this->belongsTo(UserUpload::class);
    }
}
