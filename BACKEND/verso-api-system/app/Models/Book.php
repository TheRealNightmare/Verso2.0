<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Book extends Model
{
    use HasFactory;

    public const STATUS_PENDING  = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'title', 'author', 'description', 'cover_image_url',
        'genre', 'producer', 'release_status', 'bestseller_tag',
        'average_rating', 'published_year', 'gutenberg_id', 'is_exclusive',
        'author_id', 'source', 'status', 'approved_at', 'approved_by', 'rejection_reason',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    protected $appends = ['is_bookmarked', 'is_favorited'];

    /**
     * Limit a query to books readers are allowed to see (publicly listed).
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function content()
    {
        return $this->hasOne(BookContent::class);
    }

    public function authorUser()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
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
