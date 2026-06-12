<?php

namespace App\Filament\Resources\Users\RelationManagers;

use App\Models\Book;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PublishedBooksRelationManager extends RelationManager
{
    protected static string $relationship = 'publishedBooks';

    protected static ?string $title = 'Authored books';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')->limit(40)->weight('bold'),
                TextColumn::make('genre')->badge(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        Book::STATUS_APPROVED => 'success',
                        Book::STATUS_PENDING  => 'warning',
                        Book::STATUS_REJECTED => 'danger',
                        default               => 'gray',
                    }),
                TextColumn::make('created_at')->date()->sortable(),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
