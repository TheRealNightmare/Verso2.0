<?php

namespace App\Filament\Resources\RoomMessages\Pages;

use App\Filament\Resources\RoomMessages\RoomMessageResource;
use Filament\Resources\Pages\ListRecords;

class ListRoomMessages extends ListRecords
{
    protected static string $resource = RoomMessageResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
