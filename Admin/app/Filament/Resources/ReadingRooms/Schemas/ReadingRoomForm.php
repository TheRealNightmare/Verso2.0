<?php

namespace App\Filament\Resources\ReadingRooms\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ReadingRoomForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required()
                    ->columnSpanFull(),
                Textarea::make('description')
                    ->columnSpanFull()
                    ->rows(2),
                Select::make('type')
                    ->options(['reading' => 'Reading', 'chat' => 'Chat'])
                    ->required(),
                Select::make('visibility')
                    ->options(['public' => 'Public', 'private' => 'Private'])
                    ->required(),
            ]);
    }
}
