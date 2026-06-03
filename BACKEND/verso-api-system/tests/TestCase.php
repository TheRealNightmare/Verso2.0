<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // No test should ever reach the network (e.g. an accidental Gemini call).
        // Any stray outbound HTTP request fails the test instead of going out.
        Http::preventStrayRequests();

        // All file uploads/reads go to an in-memory fake public disk so tests
        // never touch the real filesystem.
        Storage::fake('public');
    }

    /**
     * A fake uploaded image that satisfies Laravel's `image` validation rule
     * without needing the GD extension (which isn't installed in CI).
     */
    protected function fakeImage(string $name = 'photo.jpg', int $kilobytes = 100): UploadedFile
    {
        return UploadedFile::fake()->create($name, $kilobytes, 'image/jpeg');
    }
}
