<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingHistory extends Model
{
    protected $fillable = ['user_id', 'book_id', 'user_upload_id', 'progress', 'current_page', 'last_read_at'];

    protected $casts = [
        'last_read_at' => 'datetime',
        'progress'     => 'integer',
        'current_page' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}
