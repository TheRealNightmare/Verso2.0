<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookContent extends Model
{
    use HasFactory;

    protected $fillable = ['book_id', 'content', 'chapters'];

    protected $casts = [
        'chapters' => 'array',
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }
}
