<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('reading_rooms')->cascadeOnDelete();
            $table->foreignId('inviter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('invitee_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamps();

            $table->unique(['room_id', 'invitee_id']);
            $table->index(['invitee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_invitations');
    }
};
