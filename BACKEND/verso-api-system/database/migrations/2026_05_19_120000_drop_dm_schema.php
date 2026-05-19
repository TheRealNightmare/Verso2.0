<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('friendships');
    }

    public function down(): void
    {
        // Intentionally empty — the original DM migrations have been deleted.
    }
};
