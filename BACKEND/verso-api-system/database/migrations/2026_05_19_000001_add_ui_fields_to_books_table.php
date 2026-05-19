<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->string('producer')->nullable()->after('genre');
            $table->string('release_status')->nullable()->after('producer');
            $table->string('bestseller_tag')->nullable()->after('release_status');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['producer', 'release_status', 'bestseller_tag']);
        });
    }
};
