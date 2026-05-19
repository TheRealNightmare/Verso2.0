<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = ['book_id', 'title', 'order'];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function completions()
    {
        return $this->hasMany(LessonCompletion::class);
    }
}
