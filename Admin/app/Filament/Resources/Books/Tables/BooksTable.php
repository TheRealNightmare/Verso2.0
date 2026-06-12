<?php

namespace App\Filament\Resources\Books\Tables;

use App\Models\Book;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class BooksTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('cover_image_url')
                    ->label('Cover')
                    ->height(56),
                TextColumn::make('title')
                    ->searchable()
                    ->limit(40)
                    ->weight('bold'),
                TextColumn::make('author')
                    ->label('Author')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('genre')
                    ->badge()
                    ->toggleable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        Book::STATUS_APPROVED => 'success',
                        Book::STATUS_PENDING  => 'warning',
                        Book::STATUS_REJECTED => 'danger',
                        default               => 'gray',
                    }),
                TextColumn::make('source')
                    ->badge()
                    ->toggleable(),
                IconColumn::make('is_exclusive')
                    ->label('Exclusive')
                    ->boolean()
                    ->toggleable(),
                TextColumn::make('approver.name')
                    ->label('Reviewed by')
                    ->placeholder('—')
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        Book::STATUS_PENDING  => 'Pending',
                        Book::STATUS_APPROVED => 'Approved',
                        Book::STATUS_REJECTED => 'Rejected',
                    ]),
                SelectFilter::make('source')
                    ->options([
                        'author'    => 'Author upload',
                        'gutenberg' => 'Gutenberg',
                    ]),
            ])
            ->recordActions([
                Action::make('approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (Book $record): bool => $record->status !== Book::STATUS_APPROVED)
                    ->requiresConfirmation()
                    ->modalDescription('Approve this book so it becomes visible to readers.')
                    ->action(function (Book $record): void {
                        $record->update([
                            'status'           => Book::STATUS_APPROVED,
                            'approved_at'      => now(),
                            'approved_by'      => Auth::id(),
                            'rejection_reason' => null,
                        ]);
                        Notification::make()->title('Book approved')->success()->send();
                    }),
                Action::make('reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn (Book $record): bool => $record->status !== Book::STATUS_REJECTED)
                    ->schema([
                        Textarea::make('rejection_reason')
                            ->label('Reason for rejection')
                            ->required()
                            ->maxLength(1000),
                    ])
                    ->action(function (array $data, Book $record): void {
                        $record->update([
                            'status'           => Book::STATUS_REJECTED,
                            'rejection_reason' => $data['rejection_reason'],
                            'approved_at'      => null,
                            'approved_by'      => null,
                        ]);
                        Notification::make()->title('Book rejected')->danger()->send();
                    }),
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
