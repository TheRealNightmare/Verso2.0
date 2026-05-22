<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class MetaController extends Controller
{
    public function genders(): JsonResponse
    {
        return response()->json(['Male', 'Female', 'Other', 'Prefer not to say']);
    }

    public function eventCategories(): JsonResponse
    {
        return response()->json([
            'movie' => [
                'key'   => 'movie',
                'label' => 'Movie screening',
                'bg'    => '#7fb8a8',
                'text'  => '#0f3a31',
                'chip'  => '#5fa18f',
            ],
            'writer' => [
                'key'   => 'writer',
                'label' => 'Know your Writer',
                'bg'    => '#b96b6b',
                'text'  => '#3d1414',
                'chip'  => '#9a4f4f',
            ],
            'play' => [
                'key'   => 'play',
                'label' => 'Play on _____',
                'bg'    => '#a978c9',
                'text'  => '#2f1543',
                'chip'  => '#8c5cae',
            ],
            'genre' => [
                'key'   => 'genre',
                'label' => 'Genrenovia',
                'bg'    => '#c2a04a',
                'text'  => '#3d2f06',
                'chip'  => '#a5862f',
            ],
        ]);
    }
}
