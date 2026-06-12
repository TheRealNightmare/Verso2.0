<?php

namespace App\Filament\Resources\ReadingRooms\Pages;

use App\Filament\Resources\ReadingRooms\ReadingRoomResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditReadingRoom extends EditRecord
{
    protected static string $resource = ReadingRoomResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
