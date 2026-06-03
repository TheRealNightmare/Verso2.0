<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class GeminiService
{
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

        $prompt = $this->spoilerInstruction()
            ."\n\nMessage:\n\"\"\"\n".$text."\n\"\"\"";

        $json = $this->generate([['text' => $prompt]]);

        return $this->interpretSpoiler($json);
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
            $data = base64_encode($disk->get($relativePath));
        } catch (Throwable $e) {
            Log::warning('Gemini image read failed', ['error' => $e->getMessage()]);

            return null;
        }

        $prompt = $this->spoilerInstruction()
            ."\n\nDoes the attached image reveal a major plot point, twist, character death, or ending of a book/movie/show?";

        $json = $this->generate([
            ['text' => $prompt],
            ['inline_data' => ['mime_type' => $mime, 'data' => $data]],
        ]);

        return $this->interpretSpoiler($json);
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
