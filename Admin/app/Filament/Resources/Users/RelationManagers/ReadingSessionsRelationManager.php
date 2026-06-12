<?php

namespace App\Filament\Resources\Users\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReadingSessionsRelationManager extends RelationManager
{
    protected static string $relationship = 'readingSessions';

    protected static ?string $title = 'Reading sessions';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('book.title')
                    ->label('Book')
                    ->placeholder('Personal upload')
                    ->limit(40),
                TextColumn::make('started_at')->dateTime()->sortable(),
                TextColumn::make('ended_at')->dateTime()->placeholder('—'),
                TextColumn::make('duration_minutes')->label('Minutes')->numeric(),
            ])
            ->defaultSort('started_at', 'desc');
    }
}
