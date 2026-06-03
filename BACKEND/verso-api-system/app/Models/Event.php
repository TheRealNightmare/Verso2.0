<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'subtitle',
        'description',
        'date',
        'time_from',
        'time_to',
        'category',
        'host',
        'location',
        'cover_image',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    protected $appends = ['cover_image_url'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->cover_image ? Storage::disk('public')->url($this->cover_image) : null;
    }
}
