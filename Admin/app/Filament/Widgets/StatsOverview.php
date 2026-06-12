<?php

namespace App\Filament\Widgets;

use App\Models\Book;
use App\Models\CommunityMessage;
use App\Models\RoomMessage;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        $newThisWeek = User::where('created_at', '>=', now()->subWeek())->count();
        $activeToday = User::where('last_seen_at', '>=', now()->subDay())->count();
        $pending     = Book::where('status', Book::STATUS_PENDING)->count();
        $messages    = RoomMessage::count() + CommunityMessage::count();

        return [
            Stat::make('Total users', User::count())
                ->description($newThisWeek.' new this week')
                ->descriptionIcon('heroicon-m-user-plus')
                ->color('info'),

            Stat::make('Active (24h)', $activeToday)
                ->description('Seen in the last day')
                ->descriptionIcon('heroicon-m-bolt')
                ->color('success'),

            Stat::make('Pending approvals', $pending)
                ->description($pending > 0 ? 'Books awaiting review' : 'All caught up')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pending > 0 ? 'warning' : 'gray'),

            Stat::make('Total books', Book::count())
                ->description(Book::where('status', Book::STATUS_APPROVED)->count().' approved')
                ->descriptionIcon('heroicon-m-book-open')
                ->color('primary'),

            Stat::make('Banned users', User::whereNotNull('banned_at')->count())
                ->descriptionIcon('heroicon-m-no-symbol')
                ->color('danger'),

            Stat::make('Chat messages', $messages)
                ->description('Room + community')
                ->descriptionIcon('heroicon-m-chat-bubble-left-right')
                ->color('info'),
        ];
    }
}
