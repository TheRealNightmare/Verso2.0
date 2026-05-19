<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('author')->nullable();
            $table->enum('format', ['txt', 'epub', 'pdf']);
            $table->string('file_hash', 64);
            $table->unsignedBigInteger('file_size');
            $table->timestamps();
            $table->unique(['user_id', 'file_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_uploads');
    }
};
