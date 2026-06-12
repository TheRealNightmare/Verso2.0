<?php

namespace App\Filament\Resources\Books\Schemas;

use App\Models\Book;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class BookForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('title')
                    ->required()
                    ->columnSpanFull(),
                TextInput::make('author')
                    ->label('Author name')
                    ->required(),
                TextInput::make('genre'),
                Textarea::make('description')
                    ->columnSpanFull()
                    ->rows(4),
                TextInput::make('cover_image_url')
                    ->label('Cover image URL')
                    ->url()
                    ->columnSpanFull(),
                TextInput::make('producer'),
                TextInput::make('release_status'),
                TextInput::make('bestseller_tag'),
                TextInput::make('published_year')
                    ->numeric(),
                Toggle::make('is_exclusive'),
                Select::make('status')
                    ->options([
                        Book::STATUS_PENDING  => 'Pending',
                        Book::STATUS_APPROVED => 'Approved',
                        Book::STATUS_REJECTED => 'Rejected',
                    ])
                    ->default(Book::STATUS_APPROVED)
                    ->required(),
                Textarea::make('rejection_reason')
                    ->columnSpanFull()
                    ->rows(2),
            ]);
    }
}
