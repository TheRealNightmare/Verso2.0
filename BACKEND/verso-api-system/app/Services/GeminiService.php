<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class GeminiService
{
    // Spoiler verdicts depend only on the content, so identical text/images are
    // classified once and reused for a month (only confident true/false results
    // are cached — transient API failures are not).
    private const SPOILER_CACHE_DAYS = 30;

    /**
     * Whether a Gemini API key is configured. When false, every feature that
     * relies on this service degrades gracefully (no spoiler detection, no
     * AI re-ranking) instead of erroring.
     */
    public function enabled(): bool
    {
        return ! empty(config('services.gemini.key'));
    }

    /**
     * Classify whether a chat message text is a spoiler.
     *
     * @return bool|null true/false on a confident decision, null when the API
     *                   call failed (caller should leave the message unflagged).
     */
    public function classifyTextSpoiler(string $text): ?bool
    {
        $text = trim($text);
        if ($text === '') {
            return false;
        }

        $cacheKey = 'spoiler:text:'.hash('sha256', $text);
        $cached = Cache::get($cacheKey);
        if (! is_null($cached)) {
            return $cached;
        }

        $prompt = $this->spoilerInstruction()
            ."\n\nMessage:\n\"\"\"\n".$text."\n\"\"\"";

        $json = $this->generate([['text' => $prompt]]);
        $result = $this->interpretSpoiler($json);

        if (! is_null($result)) {
            Cache::put($cacheKey, $result, now()->addDays(self::SPOILER_CACHE_DAYS));
        }

        return $result;
    }

    /**
     * Classify whether an image (stored on the public disk) reveals a spoiler.
     *
     * @param  string  $relativePath  path on the 'public' disk, e.g. community-images/x.jpg
     */
    public function classifyImageSpoiler(string $relativePath): ?bool
    {
        try {
            $disk = Storage::disk('public');
            if (! $relativePath || ! $disk->exists($relativePath)) {
                return false;
            }
            // Keep payloads small; skip very large images.
            if ($disk->size($relativePath) > 4 * 1024 * 1024) {
                return false;
            }
            $mime = $this->mimeFromPath($relativePath);
            if (! $mime) {
                return false;
            }
            $raw = $disk->get($relativePath);
            $data = base64_encode($raw);
        } catch (Throwable $e) {
            Log::warning('Gemini image read failed', ['error' => $e->getMessage()]);

            return null;
        }

        $cacheKey = 'spoiler:image:'.hash('sha256', $raw);
        $cached = Cache::get($cacheKey);
        if (! is_null($cached)) {
            return $cached;
        }

        $prompt = $this->spoilerInstruction()
            ."\n\nDoes the attached image reveal a major plot point, twist, character death, or ending of a book/movie/show?";

        $json = $this->generate([
            ['text' => $prompt],
            ['inline_data' => ['mime_type' => $mime, 'data' => $data]],
        ]);
        $result = $this->interpretSpoiler($json);

        if (! is_null($result)) {
            Cache::put($cacheKey, $result, now()->addDays(self::SPOILER_CACHE_DAYS));
        }

        return $result;
    }

    /**
     * Ask Gemini to re-rank book candidates and explain each pick.
     *
     * @param  array  $context     reader profile: top genres + recent/favorite titles (no PII)
     * @param  array  $candidates  list of ['id','title','author','genre','score']
     * @return array|null          ['items' => [['id','reason'], ...], 'extra_suggestions' => [...]] or null on failure
     */
    public function rerankBookRecommendations(array $context, array $candidates): ?array
    {
        if (empty($candidates)) {
            return null;
        }

        $payload = [
            'reader'     => $context,
            'candidates' => array_map(fn ($c) => [
                'id'     => $c['id'],
                'title'  => $c['title'],
                'author' => $c['author'] ?? null,
                'genre'  => $c['genre'] ?? null,
            ], $candidates),
        ];

        $prompt = "You are a book recommendation assistant for a reading community.\n"
            ."Given a reader's history and a list of candidate books, reorder the candidates best-first for this reader.\n"
            ."Respond ONLY with JSON of the shape:\n"
            .'{"items":[{"id":<candidate id>,"reason":"one short sentence, e.g. because you read X"}],"extra_suggestions":[{"title":"...","author":"...","reason":"..."}]}'."\n"
            ."Only use ids that appear in the candidate list. extra_suggestions may name up to 3 well-known related books NOT in the list.\n\n"
            ."DATA:\n".json_encode($payload);

        $json = $this->generate([['text' => $prompt]]);
        $decoded = $this->decodeJson($json);

        if (! is_array($decoded) || ! isset($decoded['items']) || ! is_array($decoded['items'])) {
            return null;
        }

        $validIds = array_column($candidates, 'id');
        $items = [];
        foreach ($decoded['items'] as $item) {
            if (! isset($item['id']) || ! in_array((int) $item['id'], $validIds, true)) {
                continue;
            }
            $items[] = [
                'id'     => (int) $item['id'],
                'reason' => isset($item['reason']) ? (string) $item['reason'] : null,
            ];
        }

        if (empty($items)) {
            return null;
        }

        return [
            'items'             => $items,
            'extra_suggestions' => is_array($decoded['extra_suggestions'] ?? null) ? $decoded['extra_suggestions'] : [],
        ];
    }

    /**
     * Ask Gemini to build a 5-question multiple-choice comprehension quiz for a book.
     *
     * @param  string  $sourceText  book text (chapters) or, when text is thin, metadata
     * @return array|null  list of ['question','options'=>[4 strings],'answer'=>0-3] or null on failure
     */
    public function generateBookQuiz(string $title, ?string $author, string $sourceText): ?array
    {
        $sourceText = trim($sourceText);
        if ($sourceText === '') {
            return null;
        }

        // Keep the payload modest so the request stays within limits.
        $sourceText = mb_substr($sourceText, 0, 12000);

        $prompt = "You are a quiz author for a book-reading app.\n"
            ."Create EXACTLY 5 multiple-choice questions that test comprehension of the book below.\n"
            ."Each question must have EXACTLY 4 options and exactly one correct option.\n"
            ."Make questions answerable from the provided text; avoid trivia outside it.\n"
            .'Respond ONLY with JSON of the shape: {"questions":[{"question":"...","options":["a","b","c","d"],"answer":0}]} '
            ."where \"answer\" is the 0-based index of the correct option.\n\n"
            .'BOOK: '.$title.($author ? ' by '.$author : '')."\n"
            ."TEXT:\n\"\"\"\n".$sourceText."\n\"\"\"";

        $json = $this->generate([['text' => $prompt]], ['temperature' => 0.4]);
        $decoded = $this->decodeJson($json);

        if (! is_array($decoded) || ! isset($decoded['questions']) || ! is_array($decoded['questions'])) {
            return null;
        }

        $questions = [];
        foreach ($decoded['questions'] as $q) {
            if (! is_array($q) || ! isset($q['question'], $q['options'], $q['answer'])) {
                continue;
            }
            $options = array_values(array_filter(
                is_array($q['options']) ? $q['options'] : [],
                fn ($o) => is_string($o) && trim($o) !== ''
            ));
            $answer = (int) $q['answer'];
            if (count($options) !== 4 || $answer < 0 || $answer > 3) {
                continue;
            }
            $questions[] = [
                'question' => (string) $q['question'],
                'options'  => array_map(fn ($o) => (string) $o, $options),
                'answer'   => $answer,
            ];
            if (count($questions) === 5) {
                break;
            }
        }

        return count($questions) === 5 ? $questions : null;
    }

    /**
     * Answer a reader's free-text question about a highlighted passage.
     *
     * Used by the in-reader "Ask Gemini" panel: the selected text is the primary
     * context and the reader supplies the question.
     *
     * @return string|null  the answer in plain prose, or null when the API call
     *                      failed or the service is disabled.
     */
    public function answerAboutPassage(string $passage, string $question, ?string $bookTitle = null): ?string
    {
        $passage  = trim($passage);
        $question = trim($question);
        if ($passage === '' || $question === '') {
            return null;
        }

        // Keep the payload modest so the request stays within limits.
        $passage = mb_substr($passage, 0, 6000);

        $prompt = "You are a reading assistant inside a book-reading app.\n"
            ."A reader highlighted a passage and asked a question about it.\n"
            ."Answer the question concisely and clearly in plain prose, using the highlighted passage as the primary context.\n"
            ."If the question cannot be answered from the passage, use your general knowledge but stay focused on what was asked.\n\n"
            .($bookTitle ? 'BOOK: '.$bookTitle."\n" : '')
            ."HIGHLIGHTED PASSAGE:\n\"\"\"\n".$passage."\n\"\"\"\n\n"
            ."QUESTION:\n".$question;

        $json = $this->generate([['text' => $prompt]], ['responseMimeType' => 'text/plain']);

        $text = data_get($json, 'candidates.0.content.parts.0.text');
        if (! is_string($text)) {
            return null;
        }
        $text = trim($text);

        return $text === '' ? null : $text;
    }

    private function spoilerInstruction(): string
    {
        return 'You are a spoiler detector for a book-reading community chat. '
            .'A spoiler reveals major plot points, twists, character deaths, or endings of a book, movie, or show. '
            .'Casual mentions, opinions, questions, or recommendations are NOT spoilers. '
            .'Respond ONLY with JSON: {"is_spoiler": boolean, "confidence": number between 0 and 1}.';
    }

    /**
     * @return bool|null  true/false decision, or null when the call failed.
     */
    private function interpretSpoiler(?array $json): ?bool
    {
        $decoded = $this->decodeJson($json);
        if (! is_array($decoded) || ! array_key_exists('is_spoiler', $decoded)) {
            return null;
        }
        $confidence = isset($decoded['confidence']) ? (float) $decoded['confidence'] : 1.0;

        return ((bool) $decoded['is_spoiler']) && $confidence >= 0.6;
    }

    /**
     * Low-level call to the Gemini generateContent endpoint.
     *
     * @param  array  $parts  message parts (text and/or inline_data)
     * @return array|null      raw decoded response, or null on failure
     */
    private function generate(array $parts, array $generationConfig = []): ?array
    {
        if (! $this->enabled()) {
            return null;
        }

        $base  = rtrim((string) config('services.gemini.base'), '/');
        $model = config('services.gemini.model');
        $url   = "{$base}/models/{$model}:generateContent";

        try {
            $response = Http::timeout((int) config('services.gemini.timeout', 20))
                ->retry(2, 200, throw: false)
                ->withQueryParameters(['key' => config('services.gemini.key')])
                ->post($url, [
                    'contents' => [[
                        'role'  => 'user',
                        'parts' => $parts,
                    ]],
                    'generationConfig' => array_merge([
                        'responseMimeType' => 'application/json',
                        'temperature'      => 0,
                    ], $generationConfig),
                ]);

            if (! $response->successful()) {
                Log::warning('Gemini request failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return null;
            }

            return $response->json();
        } catch (Throwable $e) {
            Log::warning('Gemini request threw', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Pull and decode the JSON text the model produced.
     */
    private function decodeJson(?array $response): ?array
    {
        if (! $response) {
            return null;
        }

        $text = data_get($response, 'candidates.0.content.parts.0.text');
        if (! is_string($text) || $text === '') {
            return null;
        }

        // Strip markdown code fences if the model added them.
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $text);

        $decoded = json_decode($text, true);

        return is_array($decoded) ? $decoded : null;
    }

    private function mimeFromPath(string $path): ?string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png'         => 'image/png',
            'webp'        => 'image/webp',
            'gif'         => 'image/gif',
            default       => null,
        };
    }
}
