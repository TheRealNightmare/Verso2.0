<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_messages', function (Blueprint $table) {
            $table->boolean('is_spoiler')->default(false)->after('image_path');
            $table->enum('spoiler_source', ['ai', 'user'])->nullable()->after('is_spoiler');
            $table->timestamp('spoiler_checked_at')->nullable()->after('spoiler_source');

            $table->index('is_spoiler');
        });
    }

    public function down(): void
    {
        Schema::table('community_messages', function (Blueprint $table) {
            $table->dropIndex(['is_spoiler']);
            $table->dropColumn(['is_spoiler', 'spoiler_source', 'spoiler_checked_at']);
        });
    }
};
