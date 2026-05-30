<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('annotations', function (Blueprint $table) {
            $table->foreignId('book_id')->nullable()->change();
            $table->integer('page_index')->nullable()->change();
            $table->string('column', 8)->nullable()->change();
            $table->integer('start_offset')->nullable()->change();
            $table->integer('end_offset')->nullable()->change();

            $table->foreignId('upload_id')->nullable()->after('book_id')
                ->constrained('user_uploads')->cascadeOnDelete();
            $table->string('file_hash', 64)->nullable()->after('upload_id');
            $table->json('location')->nullable()->after('end_offset');

            $table->index(['user_id', 'upload_id']);
            $table->index(['user_id', 'file_hash']);
        });
    }

    public function down(): void
    {
        Schema::table('annotations', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'file_hash']);
            $table->dropIndex(['user_id', 'upload_id']);
            $table->dropConstrainedForeignId('upload_id');
            $table->dropColumn(['file_hash', 'location']);
            $table->foreignId('book_id')->nullable(false)->change();
            $table->integer('page_index')->nullable(false)->change();
            $table->string('column', 8)->nullable(false)->change();
            $table->integer('start_offset')->nullable(false)->change();
            $table->integer('end_offset')->nullable(false)->change();
        });
    }
};
