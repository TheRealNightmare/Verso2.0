<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true),
                Select::make('role')
                    ->options([
                        'admin'  => 'Admin',
                        'author' => 'Author',
                        'user'   => 'Reader',
                    ])
                    ->placeholder('Reader (default)'),
                TextInput::make('password')
                    ->password()
                    ->revealable()
                    // The model's 'hashed' cast hashes this on save. Only required when
                    // creating; left blank on edit keeps the existing password.
                    ->required(fn (string $operation): bool => $operation === 'create')
                    ->dehydrated(fn (?string $state): bool => filled($state)),
                TextInput::make('points')
                    ->numeric()
                    ->default(0),
                TextInput::make('avatar_url')
                    ->label('Avatar URL')
                    ->url()
                    ->columnSpanFull(),
                Textarea::make('bio')
                    ->columnSpanFull()
                    ->rows(3),
            ]);
    }
}
