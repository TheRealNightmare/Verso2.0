<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Validator;

class CreateAdmin extends Command
{
    protected $signature = 'admin:create';

    protected $description = 'Create a new admin user, or promote an existing user, for the Verso admin panel';

    public function handle(): int
    {
        $email = $this->ask('Email');

        $existing = User::where('email', $email)->first();

        if ($existing) {
            if (! $this->confirm("A user with {$email} already exists ({$existing->name}). Promote them to admin?", true)) {
                $this->warn('Aborted.');
                return self::FAILURE;
            }

            $existing->role = 'admin';
            $existing->banned_at = null;
            $existing->ban_reason = null;
            $existing->save();

            $this->info("Promoted {$existing->email} to admin.");
            return self::SUCCESS;
        }

        $name     = $this->ask('Name');
        $password = $this->secret('Password (min 8 chars)');

        $validator = Validator::make(
            compact('name', 'email', 'password'),
            [
                'name'     => ['required', 'string', 'max:255'],
                'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', Password::min(8)],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return self::FAILURE;
        }

        $user = User::create([
            'name'     => $name,
            'email'    => $email,
            'password' => Hash::make($password),
            'role'     => 'admin',
        ]);

        $this->info("Admin user created: {$user->email}");
        return self::SUCCESS;
    }
}
