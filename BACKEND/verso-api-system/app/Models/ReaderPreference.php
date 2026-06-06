<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReaderPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'font_scale',
        'theme',
        'bg_color',
        'text_color',
        'asmr_track',
        'asmr_volume',
    ];

    protected $casts = [
        'font_scale' => 'float',
        'asmr_volume' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
