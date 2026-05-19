<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('community_messages')->cascadeOnDelete();
            $table->enum('type', ['text', 'audio', 'image']);
            $table->text('body')->nullable();
            $table->string('audio_path', 1024)->nullable();
            $table->unsignedInteger('duration_sec')->nullable();
            $table->string('image_path', 1024)->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['parent_id', 'id']);
            $table->index('created_at');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_messages');
    }
};
