<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reader_preferences', function (Blueprint $table) {
            $table->string('narrator_voice')->nullable()->after('asmr_volume');
            $table->decimal('narrator_rate', 3, 2)->default(1.00)->after('narrator_voice');
        });
    }

    public function down(): void
    {
        Schema::table('reader_preferences', function (Blueprint $table) {
            $table->dropColumn(['narrator_voice', 'narrator_rate']);
        });
    }
};
