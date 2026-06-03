<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'avatar_url', 'date_of_birth', 'gender', 'bio', 'banner_color', 'points', 'last_seen_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date:Y-m-d',
            'last_seen_at' => 'datetime',
        ];
    }

    public function sentFriendships()
    {
        return $this->hasMany(Friendship::class, 'requester_id');
    }

    public function receivedFriendships()
    {
        return $this->hasMany(Friendship::class, 'addressee_id');
    }

    /**
     * The friendship row (in either direction) between this user and another, if any.
     */
    public function friendshipWith(int $otherId): ?Friendship
    {
        return Friendship::query()
            ->where(function ($q) use ($otherId) {
                $q->where('requester_id', $this->id)->where('addressee_id', $otherId);
            })
            ->orWhere(function ($q) use ($otherId) {
                $q->where('requester_id', $otherId)->where('addressee_id', $this->id);
            })
            ->first();
    }

    /**
     * Status of the relationship with another user from THIS user's perspective:
     * 'none' | 'friends' | 'request_sent' | 'request_received'.
     */
    public function friendStatusWith(int $otherId): string
    {
        $f = $this->friendshipWith($otherId);
        if (! $f) {
            return 'none';
        }
        if ($f->status === 'accepted') {
            return 'friends';
        }
        return $f->requester_id === $this->id ? 'request_sent' : 'request_received';
    }

    public function isFriendsWith(int $otherId): bool
    {
        return $this->friendStatusWith($otherId) === 'friends';
    }

    /**
     * IDs of all accepted friends.
     *
     * @return \Illuminate\Support\Collection<int, int>
     */
    public function publishedBooks()
    {
        return $this->hasMany(Book::class, 'author_id');
    }

    public function isAuthor(): bool
    {
        return $this->role === 'author';
    }

    public function friendIds()
    {
        return Friendship::query()
            ->where('status', 'accepted')
            ->where(function ($q) {
                $q->where('requester_id', $this->id)->orWhere('addressee_id', $this->id);
            })
            ->get(['requester_id', 'addressee_id'])
            ->map(fn ($f) => $f->requester_id === $this->id ? $f->addressee_id : $f->requester_id)
            ->values();
    }
}
