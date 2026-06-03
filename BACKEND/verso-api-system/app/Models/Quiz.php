<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $fillable = ['book_id', 'title', 'questions', 'max_score'];

    protected $casts = [
        'questions' => 'array',
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
