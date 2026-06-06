<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reader_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('font_scale', 3, 2)->default(1.00);
            $table->string('theme', 16)->default('light');
            $table->string('bg_color', 9)->nullable();
            $table->string('text_color', 9)->nullable();
            $table->string('asmr_track')->nullable();
            $table->unsignedTinyInteger('asmr_volume')->default(60);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reader_preferences');
    }
};
