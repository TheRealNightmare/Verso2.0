<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookContent extends Model
{
    protected $fillable = ['book_id', 'content'];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }
}
