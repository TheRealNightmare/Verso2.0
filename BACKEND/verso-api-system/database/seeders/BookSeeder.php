<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BookContent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class BookSeeder extends Seeder
{
    private array $bestsellerTags = [
        '#1 NEW YORK TIMES BESTSELLER',
        'NATIONAL BESTSELLER',
        'EDITOR\'S PICK',
        'AWARD WINNER',
        'STAFF FAVORITE',
    ];

    public function run(): void
    {
        $this->command->info('Fetching books from Project Gutenberg (gutendex.com)...');

        $books = [];
        $page  = 1;

        while (count($books) < 30) {
            $response = Http::timeout(60)->retry(3, 2000)->get('https://gutendex.com/books/', [
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

            $textUrl = $data['formats']['text/plain; charset=utf-8']
                ?? $data['formats']['text/plain; charset=us-ascii']
                ?? $data['formats']['text/plain']
                ?? null;

            $rawText = '';
            if ($textUrl) {
                try {
                    $textResponse = Http::timeout(60)->get($textUrl);
                    if ($textResponse->ok()) {
                        $rawText = $textResponse->body();
                    }
                } catch (\Exception $e) {
                    $this->command->warn("Could not fetch text for: " . $data['title']);
                }
            }

            $body     = $this->stripGutenbergBoilerplate($rawText);
            $chapters = $this->parseChapters($body);

            $book = Book::create([
                'title'           => mb_substr($data['title'], 0, 255),
                'author'          => mb_substr($author, 0, 255),
                'description'     => 'A classic work of literature from Project Gutenberg.',
                'cover_image_url' => $coverUrl,
                'genre'           => $genre ? mb_substr($genre, 0, 100) : null,
                'producer'        => 'Project Gutenberg',
                'release_status'  => count($chapters) . '/' . count($chapters),
                'bestseller_tag'  => $index < 5 ? $this->bestsellerTags[$index] : null,
                'average_rating'  => 0,
                'gutenberg_id'    => $gutenbergId,
                'is_exclusive'    => $index < 5,
            ]);

            BookContent::create([
                'book_id'  => $book->id,
                'content'  => mb_substr($body, 0, 5000),
                'chapters' => $chapters,
            ]);
        }

        $this->command->info('BookSeeder complete.');
    }

    private function stripGutenbergBoilerplate(string $text): string
    {
        if ($text === '') return '';

        if (preg_match('/\*\*\*\s*START OF.*?\*\*\*/is', $text, $m, PREG_OFFSET_CAPTURE)) {
            $text = substr($text, $m[0][1] + strlen($m[0][0]));
        }
        if (preg_match('/\*\*\*\s*END OF.*?\*\*\*/is', $text, $m, PREG_OFFSET_CAPTURE)) {
            $text = substr($text, 0, $m[0][1]);
        }
        return trim($text);
    }

    private function parseChapters(string $text): array
    {
        if ($text === '') {
            return [];
        }

        // Normalize CRLF/CR to LF so per-line anchors behave predictably.
        $text = str_replace(["\r\n", "\r"], "\n", $text);

        // Match a heading on its own line: "CHAPTER I", "Chapter 1.", "Chapter 1: Title", etc.
        $pattern = '/^[ \t]*(CHAPTER|Chapter)[ \t]+([IVXLC0-9]+)\.?[ \t]*[:\-]?[ \t]*([^\n]*)$/m';

        if (! preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE)) {
            return [[
                'number'  => 1,
                'title'   => 'Full Text',
                'content' => mb_substr($text, 0, 200000),
            ]];
        }

        // First pass: collect (heading, start, end) and drop densely packed
        // matches that are actually table-of-contents entries.
        $raw   = [];
        $count = count($matches[0]);
        for ($i = 0; $i < $count; $i++) {
            $start  = $matches[0][$i][1];
            $end    = $i + 1 < $count ? $matches[0][$i + 1][1] : strlen($text);
            $body   = trim(substr($text, $start + strlen($matches[0][$i][0]), $end - $start - strlen($matches[0][$i][0])));
            $raw[]  = [
                'heading' => trim($matches[0][$i][0]),
                'body'    => $body,
            ];
        }

        // Drop chapters with very short bodies (TOC entries, false positives).
        $real = array_values(array_filter($raw, fn($r) => mb_strlen($r['body']) >= 500));

        $chapters = [];
        foreach ($real as $i => $r) {
            $number     = $i + 1;
            $chapters[] = [
                'number'  => $number,
                'title'   => mb_substr($r['heading'], 0, 200),
                'content' => mb_substr($r['body'], 0, 50000),
            ];
        }

        if (empty($chapters)) {
            return [[
                'number'  => 1,
                'title'   => 'Full Text',
                'content' => mb_substr($text, 0, 200000),
            ]];
        }

        return $chapters;
    }
}
