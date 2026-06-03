<?php

namespace Tests\Feature;

use App\Models\Annotation;
use App\Models\Book;
use App\Models\BookContent;
use App\Models\Bookmark;
use App\Models\CommunityMessage;
use App\Models\CommunityReaction;
use App\Models\DirectMessage;
use App\Models\Event;
use App\Models\Favorite;
use App\Models\Friendship;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\ReadingHistory;
use App\Models\ReadingSession;
use App\Models\Review;
use App\Models\Todo;
use App\Models\User;
use App\Models\UserUpload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FactorySmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_factory_creates_a_row(): void
    {
        $models = [
            User::class, Book::class, BookContent::class, Review::class,
            Bookmark::class, Favorite::class, ReadingHistory::class,
            ReadingSession::class, UserUpload::class, Annotation::class,
            Quiz::class, QuizAttempt::class, Todo::class, Event::class,
            CommunityMessage::class, CommunityReaction::class,
            DirectMessage::class, Friendship::class,
        ];

        foreach ($models as $model) {
            $instance = $model::factory()->create();
            $this->assertNotNull($instance->id, "$model factory did not persist");
        }
    }
}
