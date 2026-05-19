<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class CommunityMessage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'parent_id', 'type', 'body',
        'audio_path', 'duration_sec', 'image_path', 'edited_at',
    ];

    protected $casts = [
        'edited_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function reactions()
    {
        return $this->hasMany(CommunityReaction::class, 'message_id');
    }

    protected function audioUrl(): Attribute
    {
        return Attribute::get(fn () => $this->audio_path ? Storage::disk('public')->url($this->audio_path) : null);
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn () => $this->image_path ? Storage::disk('public')->url($this->image_path) : null);
    }
}
