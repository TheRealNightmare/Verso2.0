<?php

use App\Http\Controllers\AnnotationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AuthorBookController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\BookContentController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\CommunityMessageController;
use App\Http\Controllers\CommunityReactionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\MetaController;
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ReaderAssistantController;
use App\Http\Controllers\ReaderPreferenceController;
use App\Http\Controllers\ReadingRoomController;
use App\Http\Controllers\RoomAnnotationController;
use App\Http\Controllers\RoomAnnotationCommentController;
use App\Http\Controllers\RoomMessageController;
use App\Http\Controllers\DirectMessageController;
use App\Http\Controllers\FriendshipController;
use App\Http\Controllers\ReadingSessionController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserUploadController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Books (public)
Route::get('/books/home', [BookController::class, 'home']);
Route::get('/books', [BookController::class, 'index']);
Route::get('/books/{id}', [BookController::class, 'show']);
Route::get('/books/{bookId}/reviews', [ReviewController::class, 'index']);

// Meta / reference data (public)
Route::get('/meta/genders', [MetaController::class, 'genders']);
Route::get('/meta/event-categories', [MetaController::class, 'eventCategories']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);

    // Book content (login required to read)
    Route::get('/books/{id}/content', [BookContentController::class, 'show']);

    // Annotations (per-page highlights + notes)
    Route::get   ('/books/{bookId}/annotations', [AnnotationController::class, 'index']);
    Route::post  ('/books/{bookId}/annotations', [AnnotationController::class, 'store']);
    Route::get   ('/uploads/{uploadId}/annotations', [AnnotationController::class, 'indexForUpload']);
    Route::post  ('/uploads/{uploadId}/annotations', [AnnotationController::class, 'storeForUpload']);
    Route::patch ('/annotations/{id}',           [AnnotationController::class, 'update']);
    Route::delete('/annotations/{id}',           [AnnotationController::class, 'destroy']);

    // Reviews
    Route::post('/books/{bookId}/reviews', [ReviewController::class, 'store']);

    // History
    Route::get('/history', [HistoryController::class, 'index']);
    Route::post('/history', [HistoryController::class, 'store']);
    Route::delete('/history/{id}', [HistoryController::class, 'destroy']);

    // Bookmarks
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/bookmarks', [BookmarkController::class, 'store']);
    Route::delete('/bookmarks/{bookId}', [BookmarkController::class, 'destroy']);

    // Favorites
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites/toggle', [FavoriteController::class, 'toggle']);

    // Events
    Route::get   ('/events',      [EventController::class, 'index']);
    Route::get   ('/events/{id}', [EventController::class, 'show']);
    Route::post  ('/events',      [EventController::class, 'store']);
    Route::post  ('/events/{id}', [EventController::class, 'update']); // multipart PUT via _method
    Route::delete('/events/{id}', [EventController::class, 'destroy']);

    // User uploads (local-device books — metadata only)
    Route::get('/uploads', [UserUploadController::class, 'index']);
    Route::post('/uploads', [UserUploadController::class, 'store']);
    Route::delete('/uploads/{id}', [UserUploadController::class, 'destroy']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Quizzes (AI-generated, per completed book)
    Route::get ('/quizzes/available',       [QuizController::class, 'available']);
    Route::post('/quizzes/generate',        [QuizController::class, 'generate']);
    Route::post('/quizzes/{quiz}/attempt',  [QuizController::class, 'attempt']);

    // Todos
    Route::get   ('/todos',      [TodoController::class, 'index']);
    Route::post  ('/todos',      [TodoController::class, 'store']);
    Route::patch ('/todos/{id}', [TodoController::class, 'update']);
    Route::delete('/todos/{id}', [TodoController::class, 'destroy']);

    // Profile
    Route::get  ('/profile',       [ProfileController::class, 'show']);
    Route::patch('/profile',       [ProfileController::class, 'update']);
    Route::post ('/profile/photo', [ProfileController::class, 'updatePhoto']);

    // Reader assistant (ask Gemini about a highlighted passage)
    Route::post('/reader/ask-gemini', [ReaderAssistantController::class, 'ask'])
        ->middleware('throttle:30,1');

    // Reader preferences (font size, background theme, ASMR audio)
    Route::get  ('/reading-preferences', [ReaderPreferenceController::class, 'show']);
    Route::patch('/reading-preferences', [ReaderPreferenceController::class, 'update']);

    // Reading sessions
    Route::post ('/reading-sessions',      [ReadingSessionController::class, 'store']);
    Route::patch('/reading-sessions/{id}', [ReadingSessionController::class, 'update']);

    // Community
    Route::get   ('/community/info',                            [CommunityController::class, 'info']);
    Route::get   ('/community/messages',                        [CommunityMessageController::class, 'index']);
    Route::post  ('/community/messages',                        [CommunityMessageController::class, 'store']);
    Route::patch ('/community/messages/{id}',                   [CommunityMessageController::class, 'update']);
    Route::delete('/community/messages/{id}',                   [CommunityMessageController::class, 'destroy']);
    Route::post  ('/community/messages/{id}/reactions',         [CommunityReactionController::class, 'toggle']);

    // Presence heartbeat
    Route::post('/presence/ping', [PresenceController::class, 'ping']);

    // Collaborative reading rooms
    Route::get   ('/reading-rooms',                 [ReadingRoomController::class, 'index']);
    Route::post  ('/reading-rooms',                 [ReadingRoomController::class, 'store']);
    Route::post  ('/reading-rooms/join',            [ReadingRoomController::class, 'joinByCode']);
    Route::get   ('/reading-rooms/{room}',          [ReadingRoomController::class, 'show']);
    Route::patch ('/reading-rooms/{room}',          [ReadingRoomController::class, 'update']);
    Route::delete('/reading-rooms/{room}',          [ReadingRoomController::class, 'destroy']);
    Route::post  ('/reading-rooms/{room}/join',     [ReadingRoomController::class, 'join']);
    Route::post  ('/reading-rooms/{room}/leave',    [ReadingRoomController::class, 'leave']);
    Route::post  ('/reading-rooms/{room}/invite',   [ReadingRoomController::class, 'invite']);
    Route::delete('/reading-rooms/{room}/members/{userId}', [ReadingRoomController::class, 'removeMember']);
    Route::post  ('/reading-rooms/{room}/progress', [ReadingRoomController::class, 'updateProgress']);

    // Room shared highlights
    Route::get   ('/reading-rooms/{room}/highlights', [RoomAnnotationController::class, 'index']);
    Route::post  ('/reading-rooms/{room}/highlights', [RoomAnnotationController::class, 'store']);
    Route::patch ('/room-highlights/{id}',            [RoomAnnotationController::class, 'update']);
    Route::delete('/room-highlights/{id}',            [RoomAnnotationController::class, 'destroy']);

    // Room highlight comments (threaded discussion on a highlight)
    Route::get   ('/room-highlights/{id}/comments', [RoomAnnotationCommentController::class, 'index']);
    Route::post  ('/room-highlights/{id}/comments', [RoomAnnotationCommentController::class, 'store']);
    Route::delete('/room-comments/{id}',            [RoomAnnotationCommentController::class, 'destroy']);

    // Room chat (mirrors community chat, scoped to a room)
    Route::get   ('/reading-rooms/{room}/messages',                  [RoomMessageController::class, 'index']);
    Route::post  ('/reading-rooms/{room}/messages',                  [RoomMessageController::class, 'store']);
    Route::patch ('/reading-rooms/{room}/messages/{id}',             [RoomMessageController::class, 'update']);
    Route::delete('/reading-rooms/{room}/messages/{id}',             [RoomMessageController::class, 'destroy']);
    Route::post  ('/reading-rooms/{room}/messages/{id}/reactions',   [RoomMessageController::class, 'toggleReaction']);

    // Recommendations (books + people)
    Route::get('/recommendations/books',  [RecommendationController::class, 'books']);
    Route::get('/recommendations/people', [RecommendationController::class, 'people']);

    // People search + public profiles
    Route::get('/users/search', [UserController::class, 'search']);
    Route::get('/users/{id}',   [UserController::class, 'show']);
    Route::get('/users/{id}/books', [BookController::class, 'byAuthor']);
    Route::get('/users/{id}/favorites', [FavoriteController::class, 'forUser']);

    // Author-published books
    Route::get   ('/me/books',          [BookController::class, 'myUploads']);
    Route::post  ('/author/books',      [AuthorBookController::class, 'store']);
    Route::post  ('/author/books/{id}', [AuthorBookController::class, 'update']); // multipart PATCH via _method
    Route::delete('/author/books/{id}', [AuthorBookController::class, 'destroy']);

    // Friendships (request / accept flow)
    Route::get   ('/friends',                        [FriendshipController::class, 'index']);
    Route::get   ('/friends/requests',               [FriendshipController::class, 'requests']);
    Route::post  ('/friends/requests',               [FriendshipController::class, 'store']);
    Route::post  ('/friends/requests/{id}/accept',   [FriendshipController::class, 'accept']);
    Route::post  ('/friends/requests/{id}/decline',  [FriendshipController::class, 'decline']);
    Route::delete('/friends/{userId}',               [FriendshipController::class, 'destroy']);

    // Direct messages (friends only)
    Route::get ('/messages',                 [DirectMessageController::class, 'inbox']);
    Route::get ('/messages/{userId}',        [DirectMessageController::class, 'thread']);
    Route::post('/messages/{userId}',        [DirectMessageController::class, 'store']);
    Route::post('/messages/{userId}/read',   [DirectMessageController::class, 'markRead']);
});
