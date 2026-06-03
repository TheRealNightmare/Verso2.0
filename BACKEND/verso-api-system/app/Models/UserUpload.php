<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserUpload extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'title', 'author', 'format', 'file_hash', 'file_size'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function readingHistories()
    {
        return $this->hasMany(ReadingHistory::class);
    }
}
