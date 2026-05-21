<?php

use App\Http\Controllers\AnnotationController;
use App\Http\Controllers\AuthController;
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
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReadingSessionController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TodoController;
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

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);

    // Book content (login required to read)
    Route::get('/books/{id}/content', [BookContentController::class, 'show']);

    // Annotations (per-page highlights + notes)
    Route::get   ('/books/{bookId}/annotations', [AnnotationController::class, 'index']);
    Route::post  ('/books/{bookId}/annotations', [AnnotationController::class, 'store']);
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

    // Todos
    Route::get   ('/todos',      [TodoController::class, 'index']);
    Route::post  ('/todos',      [TodoController::class, 'store']);
    Route::patch ('/todos/{id}', [TodoController::class, 'update']);
    Route::delete('/todos/{id}', [TodoController::class, 'destroy']);

    // Profile
    Route::get  ('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);

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
});
