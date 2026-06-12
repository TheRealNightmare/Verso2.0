<?php

namespace App\Filament\Resources\ReadingRooms;

use App\Filament\Resources\ReadingRooms\Pages\CreateReadingRoom;
use App\Filament\Resources\ReadingRooms\Pages\EditReadingRoom;
use App\Filament\Resources\ReadingRooms\Pages\ListReadingRooms;
use App\Filament\Resources\ReadingRooms\Schemas\ReadingRoomForm;
use App\Filament\Resources\ReadingRooms\Tables\ReadingRoomsTable;
use App\Filament\Resources\ReadingRooms\RelationManagers\MembersRelationManager;
use App\Models\ReadingRoom;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class ReadingRoomResource extends Resource
{
    protected static ?string $model = ReadingRoom::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUserGroup;

    protected static string|UnitEnum|null $navigationGroup = 'Community';

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return ReadingRoomForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ReadingRoomsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            MembersRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListReadingRooms::route('/'),
            'create' => CreateReadingRoom::route('/create'),
            'edit' => EditReadingRoom::route('/{record}/edit'),
        ];
    }
}
