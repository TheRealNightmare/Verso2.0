<?php

namespace App\Services;

use RuntimeException;
use Smalot\PdfParser\Parser as PdfParser;
use ZipArchive;

class BookParser
{
    /**
     * @return array{content: string, chapters: array<int, array{title: string, text: string}>}
     */
    public function parse(string $absolutePath, string $format): array
    {
        return match (strtolower($format)) {
            'txt'  => $this->parseTxt($absolutePath),
            'epub' => $this->parseEpub($absolutePath),
            'pdf'  => $this->parsePdf($absolutePath),
            default => throw new RuntimeException("Unsupported format: {$format}"),
        };
    }

    private function parseTxt(string $path): array
    {
        $raw = file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException('Could not read TXT file.');
        }
        $raw = $this->normalize($raw);

        // Split on lines that look like chapter headings.
        $pattern = '/^(chapter\s+[ivxlcdm\d]+.*|\d+\.\s+.+)$/im';
        $parts = preg_split($pattern, $raw, -1, PREG_SPLIT_DELIM_CAPTURE);

        $chapters = [];
        if ($parts && count($parts) >= 3) {
            // parts: [prefix, heading1, body1, heading2, body2, ...]
            $prefix = trim((string) array_shift($parts));
            if ($prefix !== '') {
                $chapters[] = ['title' => 'Preface', 'content' => $prefix];
            }
            for ($i = 0; $i + 1 < count($parts); $i += 2) {
                $title = trim((string) $parts[$i]);
                $body  = trim((string) $parts[$i + 1]);
                if ($body === '') continue;
                $chapters[] = ['title' => $title !== '' ? $title : ('Chapter '.(count($chapters) + 1)), 'content' => $body];
            }
        }

        if (empty($chapters)) {
            $chapters = $this->chunkInto($raw, 8000);
        }

        return ['content' => $raw, 'chapters' => $this->withNumbers($chapters)];
    }

    private function parseEpub(string $path): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('PHP ZipArchive extension is required to read EPUB.');
        }

        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new RuntimeException('Invalid EPUB archive.');
        }

        try {
            // Locate the OPF via container.xml.
            $container = $zip->getFromName('META-INF/container.xml');
            $opfPath = null;
            if ($container) {
                if (preg_match('/full-path="([^"]+)"/', $container, $m)) {
                    $opfPath = $m[1];
                }
            }
            if (! $opfPath) {
                throw new RuntimeException('EPUB missing container.xml or OPF path.');
            }

            $opf = $zip->getFromName($opfPath);
            if (! $opf) {
                throw new RuntimeException('EPUB OPF file unreadable.');
            }
            $baseDir = trim(dirname($opfPath), '.');
            $baseDir = $baseDir === '' ? '' : ($baseDir.'/');

            // Build id -> href manifest.
            $manifest = [];
            if (preg_match_all('/<item\s+([^>]+)\/?>/i', $opf, $items, PREG_SET_ORDER)) {
                foreach ($items as $item) {
                    $attrs = $item[1];
                    if (! preg_match('/id="([^"]+)"/', $attrs, $idM)) continue;
                    if (! preg_match('/href="([^"]+)"/', $attrs, $hrefM)) continue;
                    $manifest[$idM[1]] = $hrefM[1];
                }
            }

            // Spine = ordered idrefs.
            $spineIds = [];
            if (preg_match_all('/<itemref\s+[^>]*idref="([^"]+)"/i', $opf, $sp)) {
                $spineIds = $sp[1];
            }

            $chapters = [];
            $allText = '';
            foreach ($spineIds as $idx => $id) {
                if (! isset($manifest[$id])) continue;
                $href = $manifest[$id];
                $fullPath = $baseDir.$href;
                $html = $zip->getFromName($fullPath);
                if ($html === false) continue;

                // Extract a title from <h1>/<h2>/<title>.
                $title = 'Chapter '.($idx + 1);
                if (preg_match('/<h[12][^>]*>(.*?)<\/h[12]>/is', $html, $tm)) {
                    $candidate = trim(strip_tags($tm[1]));
                    if ($candidate !== '') $title = $candidate;
                } elseif (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $tm)) {
                    $candidate = trim(strip_tags($tm[1]));
                    if ($candidate !== '') $title = $candidate;
                }

                $text = $this->normalize(strip_tags($html));
                if ($text === '') continue;
                $chapters[] = ['title' => $title, 'content' => $text];
                $allText .= "\n\n".$text;
            }

            if (empty($chapters)) {
                throw new RuntimeException('EPUB had no readable chapters.');
            }

            return ['content' => trim($allText), 'chapters' => $this->withNumbers($chapters)];
        } finally {
            $zip->close();
        }
    }

    private function parsePdf(string $path): array
    {
        if (! class_exists(PdfParser::class)) {
            throw new RuntimeException('smalot/pdfparser is not installed. Run: composer install');
        }

        $parser = new PdfParser();
        $pdf = $parser->parseFile($path);
        $pages = $pdf->getPages();

        $chapters = [];
        $allText = '';
        foreach ($pages as $i => $page) {
            $text = $this->normalize($page->getText());
            if ($text === '') continue;
            $chapters[] = ['title' => 'Page '.($i + 1), 'content' => $text];
            $allText .= "\n\n".$text;
        }

        if (empty($chapters)) {
            throw new RuntimeException('PDF had no extractable text.');
        }

        return ['content' => trim($allText), 'chapters' => $this->withNumbers($chapters)];
    }

    /**
     * Stamp sequential `number` fields onto a chapters list so the shape matches
     * seeded books: {number, title, content}.
     */
    private function withNumbers(array $chapters): array
    {
        return array_values(array_map(
            fn ($ch, $i) => ['number' => $i + 1] + $ch,
            $chapters,
            array_keys($chapters)
        ));
    }

    private function normalize(string $s): string
    {
        $s = preg_replace('/\r\n?/', "\n", $s);
        $s = preg_replace('/[ \t]+/', ' ', $s);
        $s = preg_replace('/\n{3,}/', "\n\n", $s);
        return trim($s);
    }

    /**
     * @return array<int, array{title: string, content: string}>
     */
    private function chunkInto(string $text, int $size): array
    {
        $chunks = [];
        $len = strlen($text);
        $i = 1;
        for ($pos = 0; $pos < $len; $pos += $size) {
            $chunks[] = [
                'title'   => 'Part '.$i,
                'content' => substr($text, $pos, $size),
            ];
            $i++;
        }
        return $chunks;
    }
}
