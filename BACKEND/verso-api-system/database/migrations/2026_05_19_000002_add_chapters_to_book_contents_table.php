<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('book_contents', function (Blueprint $table) {
            $table->json('chapters')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('book_contents', function (Blueprint $table) {
            $table->dropColumn('chapters');
        });
    }
};
