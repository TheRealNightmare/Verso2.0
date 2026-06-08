<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_annotation_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_annotation_id')->constrained('room_annotations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index(['room_annotation_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_annotation_comments');
    }
};
