<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Todo extends Model
{
    protected $fillable = ['user_id', 'title', 'subtitle', 'time', 'done', 'position'];

    protected $casts = [
        'done' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
