<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookContent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class BookSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Fetching books from Project Gutenberg (gutendex.com)...');

        $books = [];
        $page  = 1;

        while (count($books) < 30) {
            $response = Http::timeout(30)->get('https://gutendex.com/books/', [
                'languages' => 'en',
                'mime_type' => 'text/plain',
                'page'      => $page,
            ]);

            if (! $response->ok()) {
                $this->command->error("Failed to fetch page {$page}");
                break;
            }

            $results = $response->json('results', []);
            if (empty($results)) break;

            $books = array_merge($books, $results);
            $page++;
        }

        $books = array_slice($books, 0, 30);

        foreach ($books as $index => $data) {
            $this->command->info("Seeding book " . ($index + 1) . "/30: " . ($data['title'] ?? 'Unknown'));

            $author      = $data['authors'][0]['name'] ?? 'Unknown Author';
            $coverUrl    = $data['formats']['image/jpeg'] ?? null;
            $genre       = $data['subjects'][0] ?? null;
            $gutenbergId = $data['id'];

            // Get plain text URL
            $textUrl = $data['formats']['text/plain; charset=utf-8']
                ?? $data['formats']['text/plain; charset=us-ascii']
                ?? $data['formats']['text/plain']
                ?? null;

            $content = '';
            if ($textUrl) {
                try {
                    $textResponse = Http::timeout(30)->get($textUrl);
                    if ($textResponse->ok()) {
                        $content = mb_substr($textResponse->body(), 0, 100000);
                    }
                } catch (\Exception $e) {
                    $this->command->warn("Could not fetch text for: " . $data['title']);
                }
            }

            $book = Book::create([
                'title'           => mb_substr($data['title'], 0, 255),
                'author'          => mb_substr($author, 0, 255),
                'description'     => 'A classic work of literature from Project Gutenberg.',
                'cover_image_url' => $coverUrl,
                'genre'           => $genre ? mb_substr($genre, 0, 100) : null,
                'average_rating'  => 0,
                'gutenberg_id'    => $gutenbergId,
                'is_exclusive'    => $index < 5,
            ]);

            BookContent::create([
                'book_id' => $book->id,
                'content' => $content,
            ]);
        }

        $this->command->info('BookSeeder complete.');
    }
}
