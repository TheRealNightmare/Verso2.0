<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reading_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('description', 500)->nullable();
            $table->enum('visibility', ['public', 'private'])->default('private');
            $table->string('join_code', 12)->nullable()->unique();
            $table->unsignedInteger('member_count')->default(1);
            $table->timestamps();

            $table->index(['visibility', 'updated_at']);
            $table->index('book_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_rooms');
    }
};
