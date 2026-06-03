<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'author', 'description', 'cover_image_url',
        'genre', 'producer', 'release_status', 'bestseller_tag',
        'average_rating', 'published_year', 'gutenberg_id', 'is_exclusive',
        'author_id', 'source',
    ];

    protected $appends = ['is_bookmarked', 'is_favorited'];

    public function content()
    {
        return $this->hasOne(BookContent::class);
    }

    public function authorUser()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function readingHistories()
    {
        return $this->hasMany(ReadingHistory::class);
    }

    public function getIsBookmarkedAttribute(): bool
    {
        $userId = Auth::id();
        if (! $userId) return false;
        return $this->bookmarks()->where('user_id', $userId)->exists();
    }

    public function getIsFavoritedAttribute(): bool
    {
        $userId = Auth::id();
        if (! $userId) return false;
        return $this->favorites()->where('user_id', $userId)->exists();
    }
}
