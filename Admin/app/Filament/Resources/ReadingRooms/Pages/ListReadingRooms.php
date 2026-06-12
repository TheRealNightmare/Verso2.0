<?php

namespace App\Filament\Resources\ReadingRooms\Pages;

use App\Filament\Resources\ReadingRooms\ReadingRoomResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListReadingRooms extends ListRecords
{
    protected static string $resource = ReadingRoomResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
