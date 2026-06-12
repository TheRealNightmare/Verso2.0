<?php

namespace App\Filament\Resources\CommunityMessages;

use App\Filament\Resources\CommunityMessages\Pages\ListCommunityMessages;
use App\Filament\Resources\CommunityMessages\Tables\CommunityMessagesTable;
use App\Models\CommunityMessage;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use UnitEnum;

class CommunityMessageResource extends Resource
{
    protected static ?string $model = CommunityMessage::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChatBubbleOvalLeftEllipsis;

    protected static string|UnitEnum|null $navigationGroup = 'Community';

    protected static ?string $navigationLabel = 'Community feed';

    protected static ?string $modelLabel = 'community message';

    // Moderation only — admins read and remove messages, never author them.
    public static function canCreate(): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return CommunityMessagesTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCommunityMessages::route('/'),
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
