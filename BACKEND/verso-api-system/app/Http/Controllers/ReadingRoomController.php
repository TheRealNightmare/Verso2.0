<?php

namespace App\Http\Controllers;

use App\Events\RoomBroadcast;
use App\Events\RoomInviteSent;
use App\Http\Controllers\Concerns\RoomMembership;
use App\Models\ReadingRoom;
use App\Models\ReadingRoomMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReadingRoomController extends Controller
{
    use RoomMembership;

    /** My rooms, or public rooms for discovery (?scope=public). */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $scope  = $request->query('scope', 'mine');
        $type   = $request->query('type'); // 'reading' | 'chat' | null (all)

        if ($scope === 'public') {
            $rooms = ReadingRoom::with('book:id,title,author,cover_image_url')
                ->where('visibility', 'public')
                ->when($type, fn ($q) => $q->where('type', $type))
                ->orderByDesc('updated_at')
                ->limit(60)
                ->get();
        } else {
            $roomIds = ReadingRoomMember::where('user_id', $userId)->pluck('room_id');
            $rooms = ReadingRoom::with('book:id,title,author,cover_image_url')
                ->whereIn('id', $roomIds)
                ->when($type, fn ($q) => $q->where('type', $type))
                ->orderByDesc('updated_at')
                ->get();
        }

        return response()->json([
            'data' => $rooms->map(fn ($r) => $this->shapeRoom($r, $userId)),
        ]);
    }

    public function show(Request $request, int $roomId): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = ReadingRoom::with('book:id,title,author,cover_image_url')->findOrFail($roomId);

        // Private room contents require membership; public metadata is open.
        if ($room->visibility === 'private' && ! $room->isMember($userId)) {
            abort(403, 'This room is private.');
        }

        $members = $room->members()->with('user:id,name,avatar_url')->get();

        return response()->json([
            'room'       => $this->shapeRoom($room, $userId),
            'membership' => $this->shapeMembership($room->memberFor($userId)),
            'members'    => $members->map(fn ($m) => $this->shapeMember($m)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'type'        => ['sometimes', 'in:reading,chat'],
            'book_id'     => ['nullable', 'required_if:type,reading', 'integer', 'exists:books,id'],
            'name'        => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'visibility'  => ['required', 'in:public,private'],
        ]);

        $type = $validated['type'] ?? 'reading';

        $room = ReadingRoom::create([
            'book_id'      => $type === 'chat' ? null : $validated['book_id'],
            'owner_id'     => $userId,
            'type'         => $type,
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'visibility'   => $validated['visibility'],
            'join_code'    => $this->freshJoinCode(),
            'member_count' => 1,
        ]);

        ReadingRoomMember::create([
            'room_id'         => $room->id,
            'user_id'         => $userId,
            'role'            => 'owner',
            'highlight_color' => $this->nextHighlightColor($room),
            'joined_at'       => now(),
        ]);

        $room->load('book:id,title,author,cover_image_url');

        return response()->json($this->shapeRoom($room, $userId), 201);
    }

    public function update(Request $request, int $roomId): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = $this->findRoom($roomId);
        $this->requireOwner($room, $userId);

        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'visibility'  => ['sometimes', 'in:public,private'],
            'regenerate_code' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('regenerate_code')) {
            $room->join_code = $this->freshJoinCode();
        }
        $room->fill(array_intersect_key($validated, array_flip(['name', 'description', 'visibility'])));
        $room->save();
        $room->load('book:id,title,author,cover_image_url');

        return response()->json($this->shapeRoom($room, $userId));
    }

    public function destroy(Request $request, int $roomId): JsonResponse
    {
        $room = $this->findRoom($roomId);
        $this->requireOwner($room, $request->user()->id);
        $room->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    public function join(Request $request, int $roomId): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = $this->findRoom($roomId);

        if ($room->visibility === 'private') {
            abort(403, 'This room is private. Join with an invite code.');
        }

        return $this->addMember($room, $userId);
    }

    public function joinByCode(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:12'],
        ]);

        $room = ReadingRoom::where('join_code', $validated['code'])->firstOrFail();

        return $this->addMember($room, $userId);
    }

    public function leave(Request $request, int $roomId): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = $this->findRoom($roomId);
        $member = $room->memberFor($userId);

        if (! $member) {
            return response()->json(['message' => 'Not a member.']);
        }

        $wasOwner = $member->role === 'owner';
        $member->delete();
        $room->decrement('member_count');

        broadcast(new RoomBroadcast($room->id, 'member.left', ['userId' => $userId]));

        if ($wasOwner) {
            $next = $room->members()->orderBy('joined_at')->first();
            if ($next) {
                $next->update(['role' => 'owner']);
                $room->update(['owner_id' => $next->user_id]);
            } else {
                $room->delete(); // empty room — clean up
            }
        }

        return response()->json(['message' => 'Left room.']);
    }

    public function invite(Request $request, int $roomId): JsonResponse
    {
        $me   = $request->user();
        $room = $this->findRoom($roomId);
        $this->requireMember($room, $me->id);

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);
        $inviteeId = (int) $validated['user_id'];

        if (! $me->isFriendsWith($inviteeId)) {
            abort(422, 'You can only invite friends.');
        }

        broadcast(new RoomInviteSent($inviteeId, [
            'roomId'   => $room->id,
            'name'     => $room->name,
            'joinCode' => $room->join_code,
            'from'     => [
                'id'        => $me->id,
                'name'      => $me->name,
                'avatarUrl' => $me->avatar_url,
            ],
        ]));

        return response()->json(['message' => 'Invite sent.']);
    }

    /** Owner removes another member from the room. */
    public function removeMember(Request $request, int $roomId, int $userId): JsonResponse
    {
        $room = $this->findRoom($roomId);
        $this->requireOwner($room, $request->user()->id);

        if ($userId === $room->owner_id) {
            abort(422, 'The owner cannot be removed.');
        }

        $member = $room->memberFor($userId);
        if (! $member) {
            return response()->json(['message' => 'Not a member.']);
        }

        $member->delete();
        $room->decrement('member_count');

        broadcast(new RoomBroadcast($room->id, 'member.left', ['userId' => $userId]));

        return response()->json(['message' => 'Member removed.']);
    }

    public function updateProgress(Request $request, int $roomId): JsonResponse
    {
        $userId = $request->user()->id;
        $room   = $this->findRoom($roomId);
        $member = $this->requireMember($room, $userId);

        $validated = $request->validate([
            'page' => ['required', 'integer', 'min:0'],
        ]);

        $member->update([
            'last_page'      => $validated['page'],
            'last_active_at' => now(),
        ]);

        broadcast(new RoomBroadcast($room->id, 'member.progress', [
            'userId' => $userId,
            'page'   => $validated['page'],
        ]))->toOthers();

        return response()->json(['ok' => true]);
    }

    // --- helpers -----------------------------------------------------------

    private function addMember(ReadingRoom $room, int $userId): JsonResponse
    {
        $existing = $room->memberFor($userId);
        if ($existing) {
            $room->load('book:id,title,author,cover_image_url');
            return response()->json($this->shapeRoom($room, $userId));
        }

        ReadingRoomMember::create([
            'room_id'         => $room->id,
            'user_id'         => $userId,
            'role'            => 'member',
            'highlight_color' => $this->nextHighlightColor($room),
            'joined_at'       => now(),
        ]);
        $room->increment('member_count');

        $member = $room->memberFor($userId)->load('user:id,name,avatar_url');
        broadcast(new RoomBroadcast($room->id, 'member.joined', $this->shapeMember($member)));

        $room->load('book:id,title,author,cover_image_url');
        return response()->json($this->shapeRoom($room, $userId), 201);
    }

    private function freshJoinCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (ReadingRoom::where('join_code', $code)->exists());

        return $code;
    }

    private function shapeRoom(ReadingRoom $room, int $userId): array
    {
        $isOwner  = $room->owner_id === $userId;
        $isMember = $room->isMember($userId);
        // Owners always see the code; chat rooms also expose it to any member so
        // anyone can share the invite link. Reading rooms stay owner-only.
        $showCode = $isOwner || ($room->type === 'chat' && $isMember);

        return [
            'id'          => $room->id,
            'bookId'      => $room->book_id,
            'type'        => $room->type,
            'name'        => $room->name,
            'description' => $room->description,
            'visibility'  => $room->visibility,
            'joinCode'    => $showCode ? $room->join_code : null,
            'memberCount' => $room->member_count,
            'isOwner'     => $isOwner,
            'isMember'    => $isMember,
            'book'        => $room->book ? [
                'id'       => $room->book->id,
                'title'    => $room->book->title,
                'author'   => $room->book->author,
                'coverUrl' => $room->book->cover_image_url,
            ] : null,
            'updatedAt'   => $room->updated_at?->toIso8601String(),
        ];
    }

    private function shapeMembership(?ReadingRoomMember $m): ?array
    {
        if (! $m) {
            return null;
        }
        return [
            'role'           => $m->role,
            'highlightColor' => $m->highlight_color,
            'lastPage'       => $m->last_page,
        ];
    }

    private function shapeMember(ReadingRoomMember $m): array
    {
        return [
            'userId'    => $m->user_id,
            'name'      => $m->user?->name,
            'avatarUrl' => $m->user?->avatar_url,
            'color'     => $m->highlight_color,
            'role'      => $m->role,
            'lastPage'  => $m->last_page,
        ];
    }
}
