<?php

namespace App\Filament\Resources\ReadingRooms\RelationManagers;

use Filament\Actions\DeleteAction;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class MembersRelationManager extends RelationManager
{
    protected static string $relationship = 'members';

    protected static ?string $title = 'Members';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->label('Member')
                    ->searchable(),
                TextColumn::make('role')
                    ->badge()
                    ->color(fn (string $state): string => $state === 'owner' ? 'warning' : 'gray'),
                TextColumn::make('last_active_at')
                    ->label('Last active')
                    ->since()
                    ->placeholder('—'),
                TextColumn::make('joined_at')
                    ->dateTime()
                    ->placeholder('—'),
            ])
            ->recordActions([
                // Owners can't be removed from their own room here.
                DeleteAction::make()
                    ->label('Remove')
                    ->visible(fn ($record): bool => $record->role !== 'owner'),
            ]);
    }
}
