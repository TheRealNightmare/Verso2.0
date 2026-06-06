<?php

namespace App\Http\Controllers;

use App\Models\ReaderPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReaderPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->shape($request->user()->readerPreference));
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'font_scale'  => ['sometimes', 'numeric', 'min:0.8', 'max:2'],
            'theme'       => ['sometimes', 'string', 'in:light,sepia,mist,dark,custom'],
            'bg_color'    => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'text_color'  => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'asmr_track'  => ['sometimes', 'nullable', 'string', 'max:64'],
            'asmr_volume' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ]);

        $pref = ReaderPreference::updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated,
        );

        return response()->json($this->shape($pref));
    }

    private function shape(?ReaderPreference $pref): array
    {
        return [
            'fontScale'  => $pref?->font_scale !== null ? (float) $pref->font_scale : 1.0,
            'theme'      => $pref?->theme ?? 'light',
            'bgColor'    => $pref?->bg_color,
            'textColor'  => $pref?->text_color,
            'asmrTrack'  => $pref?->asmr_track,
            'asmrVolume' => $pref?->asmr_volume ?? 60,
        ];
    }
}
