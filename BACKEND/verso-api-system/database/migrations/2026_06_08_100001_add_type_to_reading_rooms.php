<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reading_rooms', function (Blueprint $table) {
            // Chat rooms aren't tied to a book, so book_id becomes optional.
            $table->foreignId('book_id')->nullable()->change();
            // Distinguishes book-bound reading rooms from standalone chat rooms.
            $table->enum('type', ['reading', 'chat'])->default('reading')->after('owner_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::table('reading_rooms', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn('type');
            $table->foreignId('book_id')->nullable(false)->change();
        });
    }
};
