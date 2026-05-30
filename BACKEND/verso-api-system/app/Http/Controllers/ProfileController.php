<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->shape($request->user()));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'             => ['sometimes', 'string', 'max:255'],
            'email'            => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'date_of_birth'    => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'gender'           => ['sometimes', 'nullable', 'string', 'max:32'],
            'bio'              => ['sometimes', 'nullable', 'string', 'max:1000'],
            'current_password' => ['required_with:password', 'string'],
            'password'         => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        if (! empty($validated['password'])) {
            if (! Hash::check($validated['current_password'] ?? '', $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }
            $user->password = $validated['password'];
        }

        $user->fill(collect($validated)->only(['name', 'email', 'date_of_birth', 'gender', 'bio'])->all());
        $user->save();

        return response()->json($this->shape($user->fresh()));
    }

    public function updatePhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'max:5120'],
        ]);

        $user = $request->user();

        // Remove the previous photo if it was stored on the public disk by us.
        if ($user->avatar_url && str_contains($user->avatar_url, '/storage/avatars/')) {
            $oldPath = 'avatars/'.basename(parse_url($user->avatar_url, PHP_URL_PATH));
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('photo')->store('avatars', 'public');
        $user->avatar_url = Storage::disk('public')->url($path);
        $user->save();

        return response()->json(['avatarUrl' => $user->avatar_url]);
    }

    private function shape($user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->role,
            'avatarUrl'   => $user->avatar_url,
            'dateOfBirth' => $user->date_of_birth?->format('Y-m-d'),
            'gender'      => $user->gender,
            'bio'         => $user->bio,
            'points'      => $user->points,
        ];
    }
}
