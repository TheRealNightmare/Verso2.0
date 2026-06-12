<?php

namespace App\Filament\Resources\Users\Tables;

use App\Models\User;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('avatar_url')
                    ->label('')
                    ->circular()
                    ->height(40),
                TextColumn::make('name')
                    ->searchable()
                    ->weight('bold'),
                TextColumn::make('email')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('role')
                    ->badge()
                    ->placeholder('reader')
                    ->color(fn (?string $state): string => match ($state) {
                        'admin'  => 'danger',
                        'author' => 'info',
                        default  => 'gray',
                    }),
                TextColumn::make('points')
                    ->numeric()
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('last_seen_at')
                    ->label('Last seen')
                    ->since()
                    ->sortable()
                    ->placeholder('never'),
                TextColumn::make('banned_at')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn ($state): string => $state ? 'Banned' : 'Active')
                    ->color(fn ($state): string => $state ? 'danger' : 'success'),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('role')
                    ->options([
                        'admin'  => 'Admin',
                        'author' => 'Author',
                        'user'   => 'Reader',
                    ]),
                TernaryFilter::make('banned')
                    ->label('Banned')
                    ->placeholder('All users')
                    ->trueLabel('Banned only')
                    ->falseLabel('Active only')
                    ->queries(
                        true: fn (Builder $q) => $q->whereNotNull('banned_at'),
                        false: fn (Builder $q) => $q->whereNull('banned_at'),
                    ),
            ])
            ->recordActions([
                Action::make('ban')
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->visible(fn (User $record): bool => ! $record->isBanned())
                    ->schema([
                        Textarea::make('ban_reason')
                            ->label('Reason (shown to the user)')
                            ->maxLength(255),
                    ])
                    ->action(function (array $data, User $record): void {
                        $record->update([
                            'banned_at'  => now(),
                            'ban_reason' => $data['ban_reason'] ?? null,
                        ]);

                        // Revoke the user's API tokens so they're logged out everywhere.
                        DB::table('personal_access_tokens')
                            ->where('tokenable_type', User::class)
                            ->where('tokenable_id', $record->id)
                            ->delete();

                        Notification::make()->title('User banned and tokens revoked')->danger()->send();
                    }),
                Action::make('unban')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (User $record): bool => $record->isBanned())
                    ->requiresConfirmation()
                    ->action(function (User $record): void {
                        $record->update(['banned_at' => null, 'ban_reason' => null]);
                        Notification::make()->title('User unbanned')->success()->send();
                    }),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
