<?php

namespace App\Filament\Widgets;

use App\Models\CommunityMessage;
use Filament\Actions\DeleteAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Database\Eloquent\Builder;

class LatestCommunityMessages extends TableWidget
{
    protected static ?string $heading = 'Moderation queue — latest community messages';

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                fn (): Builder => CommunityMessage::query()->latest()
            )
            ->paginated([10, 25])
            ->columns([
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('user.name')
                    ->label('Author')
                    ->searchable(),
                TextColumn::make('body')
                    ->label('Message')
                    ->limit(70)
                    ->wrap()
                    ->placeholder('—'),
            ])
            ->recordActions([
                DeleteAction::make(),
            ]);
    }
}
