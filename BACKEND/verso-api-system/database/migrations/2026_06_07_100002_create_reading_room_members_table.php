<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reading_room_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('reading_rooms')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('role', ['owner', 'member'])->default('member');
            $table->string('highlight_color', 9);
            $table->unsignedInteger('last_page')->default(0);
            $table->timestamp('last_active_at')->nullable();
            $table->timestamp('joined_at')->useCurrent();

            $table->unique(['room_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_room_members');
    }
};
