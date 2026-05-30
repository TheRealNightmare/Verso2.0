<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookContent;
use App\Services\BookParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AuthorBookController extends Controller
{
    public function store(Request $request, BookParser $parser): JsonResponse
    {
        $user = $request->user();
        if (! $user->isAuthor()) {
            return response()->json(['message' => 'Only authors can publish books.'], 403);
        }

        // PHP silently drops $_POST / $_FILES when the request body exceeds post_max_size.
        // Detect that and return a clear 413 instead of an opaque "file failed to upload".
        if (empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
            return response()->json([
                'message' => 'Upload too large. Maximum is 100 MB.',
            ], 413);
        }

        // Map PHP upload error codes to friendlier messages before validation.
        $rawFile = $request->files->get('file');
        if ($rawFile && ! $rawFile->isValid()) {
            $msg = match ($rawFile->getError()) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Book file is too large. Maximum is 100 MB.',
                UPLOAD_ERR_PARTIAL                        => 'Upload was interrupted. Please try again.',
                UPLOAD_ERR_NO_FILE                        => 'No file was uploaded.',
                default                                   => 'Upload failed: '.$rawFile->getErrorMessage(),
            };
            return response()->json(['message' => $msg, 'errors' => ['file' => [$msg]]], 422);
        }

        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'description'  => ['required', 'string'],
            'genre'        => ['required', 'string', 'max:255'],
            'cover'        => ['required', 'image', 'max:5120'],
            'format'       => ['required', 'in:txt,epub,pdf'],
            'file'         => ['required', 'file', 'max:102400'],
            'is_exclusive' => ['sometimes', 'boolean'],
        ]);

        $bookFile = $request->file('file');

        // Save raw file to temp so we can hand a path to the parser.
        $tempPath = $bookFile->getRealPath();
        try {
            $parsed = $parser->parse($tempPath, $validated['format']);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Could not parse book: '.$e->getMessage()], 422);
        }

        $coverPath = $request->file('cover')->store('books/covers', 'public');
        $coverUrl  = Storage::disk('public')->url($coverPath);

        $book = DB::transaction(function () use ($user, $validated, $coverUrl, $parsed) {
            $book = Book::create([
                'title'           => $validated['title'],
                'author'          => $user->name,
                'description'     => $validated['description'],
                'cover_image_url' => $coverUrl,
                'genre'           => $validated['genre'],
                'is_exclusive'    => (bool) ($validated['is_exclusive'] ?? false),
                'author_id'       => $user->id,
                'source'          => 'author',
            ]);

            BookContent::create([
                'book_id'  => $book->id,
                'content'  => $parsed['content'],
                'chapters' => $parsed['chapters'],
            ]);

            return $book;
        });

        return response()->json($book->fresh()->loadCount('reviews'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $book = Book::where('author_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'title'        => ['sometimes', 'string', 'max:255'],
            'description'  => ['sometimes', 'string'],
            'genre'        => ['sometimes', 'string', 'max:255'],
            'cover'        => ['sometimes', 'image', 'max:5120'],
            'is_exclusive' => ['sometimes', 'boolean'],
        ]);

        if ($request->hasFile('cover')) {
            // Remove old cover if it's one we stored.
            if ($book->cover_image_url && str_contains($book->cover_image_url, '/storage/books/covers/')) {
                $old = 'books/covers/'.basename(parse_url($book->cover_image_url, PHP_URL_PATH));
                Storage::disk('public')->delete($old);
            }
            $coverPath = $request->file('cover')->store('books/covers', 'public');
            $book->cover_image_url = Storage::disk('public')->url($coverPath);
        }

        $book->fill(collect($validated)->only(['title', 'description', 'genre', 'is_exclusive'])->all());
        $book->save();

        return response()->json($book->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $book = Book::where('author_id', $user->id)->findOrFail($id);

        if ($book->cover_image_url && str_contains($book->cover_image_url, '/storage/books/covers/')) {
            $old = 'books/covers/'.basename(parse_url($book->cover_image_url, PHP_URL_PATH));
            Storage::disk('public')->delete($old);
        }

        $book->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
