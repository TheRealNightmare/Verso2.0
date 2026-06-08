<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('reading_rooms')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('room_messages')->cascadeOnDelete();
            $table->enum('type', ['text', 'audio', 'image']);
            $table->text('body')->nullable();
            $table->string('audio_path', 1024)->nullable();
            $table->unsignedInteger('duration_sec')->nullable();
            $table->string('image_path', 1024)->nullable();
            $table->boolean('is_spoiler')->default(false);
            $table->string('spoiler_source', 16)->nullable();
            $table->timestamp('spoiler_checked_at')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['room_id', 'id']);
            $table->index(['room_id', 'parent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_messages');
    }
};
