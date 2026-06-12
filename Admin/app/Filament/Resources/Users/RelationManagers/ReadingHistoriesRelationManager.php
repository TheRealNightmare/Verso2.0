<?php

namespace App\Filament\Resources\Users\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReadingHistoriesRelationManager extends RelationManager
{
    protected static string $relationship = 'readingHistories';

    protected static ?string $title = 'Reading history';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('book.title')
                    ->label('Book')
                    ->placeholder('Personal upload')
                    ->limit(40),
                TextColumn::make('progress')->numeric()->suffix('%'),
                TextColumn::make('current_page')->label('Page')->numeric(),
                TextColumn::make('last_read_at')->dateTime()->sortable(),
            ])
            ->defaultSort('last_read_at', 'desc');
    }
}
