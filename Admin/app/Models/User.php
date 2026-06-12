<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Maps the shared `users` table owned by the Verso API backend.
 * This app never migrates it — it only reads/writes existing columns.
 */
class User extends Authenticatable implements FilamentUser
{
    use Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'avatar_url', 'date_of_birth',
        'gender', 'bio', 'banner_color', 'points', 'last_seen_at',
        'banned_at', 'ban_reason',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'date_of_birth'     => 'date:Y-m-d',
            'last_seen_at'      => 'datetime',
            'banned_at'         => 'datetime',
            'points'            => 'integer',
        ];
    }

    /**
     * Only admins who are not banned may open the panel.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->role === 'admin' && $this->banned_at === null;
    }

    public function isBanned(): bool
    {
        return $this->banned_at !== null;
    }

    public function publishedBooks(): HasMany
    {
        return $this->hasMany(Book::class, 'author_id');
    }

    public function readingSessions(): HasMany
    {
        return $this->hasMany(ReadingSession::class);
    }

    public function readingHistories(): HasMany
    {
        return $this->hasMany(ReadingHistory::class);
    }

    public function roomMessages(): HasMany
    {
        return $this->hasMany(RoomMessage::class);
    }

    public function communityMessages(): HasMany
    {
        return $this->hasMany(CommunityMessage::class);
    }

    public function roomMemberships(): HasMany
    {
        return $this->hasMany(ReadingRoomMember::class, 'user_id');
    }
}
