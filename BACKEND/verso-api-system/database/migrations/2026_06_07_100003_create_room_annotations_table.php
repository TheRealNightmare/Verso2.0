<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('reading_rooms')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // author
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->unsignedInteger('page_index');
            $table->string('column', 8);             // 'left' | 'right'
            $table->unsignedInteger('start_offset');
            $table->unsignedInteger('end_offset');
            $table->text('selected_text');
            $table->text('note')->nullable();
            $table->string('color', 9)->nullable();
            $table->unsignedInteger('comment_count')->default(0);
            $table->timestamps();

            $table->index(['room_id', 'page_index', 'column']);
            $table->index(['room_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_annotations');
    }
};
