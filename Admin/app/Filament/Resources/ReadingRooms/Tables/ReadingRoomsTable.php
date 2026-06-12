<?php

namespace App\Filament\Resources\ReadingRooms\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ReadingRoomsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->weight('bold'),
                TextColumn::make('type')
                    ->badge(),
                TextColumn::make('owner.name')
                    ->label('Owner')
                    ->searchable(),
                TextColumn::make('book.title')
                    ->label('Book')
                    ->placeholder('—')
                    ->limit(30)
                    ->toggleable(),
                TextColumn::make('visibility')
                    ->badge()
                    ->color(fn (string $state): string => $state === 'public' ? 'success' : 'gray'),
                TextColumn::make('member_count')
                    ->label('Members')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('type')
                    ->options(['reading' => 'Reading', 'chat' => 'Chat']),
                SelectFilter::make('visibility')
                    ->options(['public' => 'Public', 'private' => 'Private']),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
