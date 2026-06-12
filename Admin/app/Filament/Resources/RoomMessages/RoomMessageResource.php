<?php

namespace App\Filament\Resources\RoomMessages;

use App\Filament\Resources\RoomMessages\Pages\ListRoomMessages;
use App\Filament\Resources\RoomMessages\Tables\RoomMessagesTable;
use App\Models\RoomMessage;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use UnitEnum;

class RoomMessageResource extends Resource
{
    protected static ?string $model = RoomMessage::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChatBubbleLeftRight;

    protected static string|UnitEnum|null $navigationGroup = 'Community';

    protected static ?string $navigationLabel = 'Room chat';

    protected static ?string $modelLabel = 'room message';

    // Moderation only — admins read and remove messages, never author them.
    public static function canCreate(): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return RoomMessagesTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListRoomMessages::route('/'),
        ];
    }

    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
