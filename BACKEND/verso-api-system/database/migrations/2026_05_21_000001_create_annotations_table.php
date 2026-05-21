<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->integer('page_index');           // index into the runtime pages[] array
            $table->string('column', 8);             // 'left' | 'right'
            $table->integer('start_offset');         // char offset within that column's text
            $table->integer('end_offset');
            $table->text('selected_text');           // the highlighted substring (display + safety)
            $table->text('note')->nullable();
            $table->string('color', 32)->nullable(); // optional highlight color
            $table->timestamps();
            $table->index(['user_id', 'book_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('annotations');
    }
};
