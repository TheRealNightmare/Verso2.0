<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Convert any locally-hosted avatar URLs that were stored as absolute URLs
     * (e.g. http://localhost/storage/... or http://localhost:8000/storage/...)
     * into relative paths (/storage/...). External avatars (e.g. pravatar.cc)
     * contain no "/storage" segment and are left untouched.
     */
    public function up(): void
    {
        foreach (['http://localhost:8000/storage', 'http://localhost/storage'] as $prefix) {
            DB::table('users')
                ->whereNotNull('avatar_url')
                ->where('avatar_url', 'like', $prefix.'%')
                ->update([
                    'avatar_url' => DB::raw("REPLACE(avatar_url, '".$prefix."', '/storage')"),
                ]);
        }
    }

    public function down(): void
    {
        // No-op: relative paths are the desired canonical form.
    }
};
