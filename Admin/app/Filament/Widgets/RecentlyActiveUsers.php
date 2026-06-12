<?php

namespace App\Filament\Widgets;

use App\Models\User;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;

class RecentlyActiveUsers extends TableWidget
{
    protected static ?string $heading = 'Recently active users';

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                fn (): Builder => User::query()
                    ->whereNotNull('last_seen_at')
                    ->orderByDesc('last_seen_at')
            )
            ->paginated([10, 25])
            ->columns([
                ImageColumn::make('avatar_url')
                    ->label('')
                    ->circular()
                    ->height(36),
                TextColumn::make('name')
                    ->weight('bold')
                    ->searchable(),
                TextColumn::make('role')
                    ->badge()
                    ->placeholder('reader'),
                TextColumn::make('last_seen_at')
                    ->label('Last seen')
                    ->since(),
            ]);
    }
}
