<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
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
        'approved_at'    => 'datetime',
        'is_exclusive'   => 'boolean',
        'average_rating' => 'float',
    ];

    public function authorUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
