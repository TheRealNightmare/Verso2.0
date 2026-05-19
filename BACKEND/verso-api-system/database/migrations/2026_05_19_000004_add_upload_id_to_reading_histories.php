<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reading_histories', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'book_id']);
        });

        Schema::table('reading_histories', function (Blueprint $table) {
            $table->foreignId('book_id')->nullable()->change();
            $table->foreignId('user_upload_id')
                ->nullable()
                ->after('book_id')
                ->constrained('user_uploads')
                ->cascadeOnDelete();
            $table->unique(['user_id', 'book_id', 'user_upload_id']);
        });
    }

    public function down(): void
    {
        Schema::table('reading_histories', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'book_id', 'user_upload_id']);
            $table->dropConstrainedForeignId('user_upload_id');
            $table->foreignId('book_id')->nullable(false)->change();
            $table->unique(['user_id', 'book_id']);
        });
    }
};
