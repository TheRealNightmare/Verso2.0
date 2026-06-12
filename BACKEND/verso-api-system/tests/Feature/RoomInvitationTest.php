<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\ReadingRoom;
use App\Models\ReadingRoomMember;
use App\Models\RoomInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoomInvitationTest extends TestCase
{
    use RefreshDatabase;

    /** Create a chat room owned by $owner (chat avoids needing a book). */
    private function makeRoom(User $owner): ReadingRoom
    {
        $room = ReadingRoom::create([
            'owner_id'     => $owner->id,
            'type'         => 'chat',
            'name'         => 'Test Room',
            'visibility'   => 'private',
            'join_code'    => 'TESTCODE',
            'member_count' => 1,
        ]);
        ReadingRoomMember::create([
            'room_id'         => $room->id,
            'user_id'         => $owner->id,
            'role'            => 'owner',
            'highlight_color' => '#fde68a',
            'joined_at'       => now(),
        ]);
        return $room;
    }

    private function befriend(User $a, User $b): void
    {
        Friendship::factory()->accepted()->create([
            'requester_id' => $a->id,
            'addressee_id' => $b->id,
        ]);
    }

    public function test_requires_auth(): void
    {
        $this->getJson('/api/room-invitations')->assertStatus(401);
    }

    public function test_invite_creates_pending_invitation_for_a_friend(): void
    {
        $owner  = User::factory()->create();
        $friend = User::factory()->create();
        $this->befriend($owner, $friend);
        $room = $this->makeRoom($owner);
        Sanctum::actingAs($owner);

        $this->postJson("/api/reading-rooms/{$room->id}/invite", ['user_id' => $friend->id])
            ->assertOk();

        $this->assertDatabaseHas('room_invitations', [
            'room_id'    => $room->id,
            'inviter_id' => $owner->id,
            'invitee_id' => $friend->id,
            'status'     => 'pending',
        ]);
    }

    public function test_cannot_invite_non_friend(): void
    {
        $owner     = User::factory()->create();
        $stranger  = User::factory()->create();
        $room = $this->makeRoom($owner);
        Sanctum::actingAs($owner);

        $this->postJson("/api/reading-rooms/{$room->id}/invite", ['user_id' => $stranger->id])
            ->assertStatus(422);

        $this->assertDatabaseCount('room_invitations', 0);
    }

    public function test_cannot_invite_existing_member(): void
    {
        $owner  = User::factory()->create();
        $friend = User::factory()->create();
        $this->befriend($owner, $friend);
        $room = $this->makeRoom($owner);
        ReadingRoomMember::create([
            'room_id' => $room->id, 'user_id' => $friend->id, 'role' => 'member',
            'highlight_color' => '#bbf7d0', 'joined_at' => now(),
        ]);
        Sanctum::actingAs($owner);

        $this->postJson("/api/reading-rooms/{$room->id}/invite", ['user_id' => $friend->id])
            ->assertStatus(422);
    }

    public function test_re_inviting_declined_user_resets_to_pending(): void
    {
        $owner  = User::factory()->create();
        $friend = User::factory()->create();
        $this->befriend($owner, $friend);
        $room = $this->makeRoom($owner);
        $inv = RoomInvitation::create([
            'room_id' => $room->id, 'inviter_id' => $owner->id,
            'invitee_id' => $friend->id, 'status' => 'declined',
        ]);
        Sanctum::actingAs($owner);

        $this->postJson("/api/reading-rooms/{$room->id}/invite", ['user_id' => $friend->id])
            ->assertOk();

        $this->assertSame('pending', $inv->fresh()->status);
        $this->assertDatabaseCount('room_invitations', 1);
    }

    public function test_index_lists_my_pending_invitations(): void
    {
        $owner  = User::factory()->create(['name' => 'Inviter']);
        $friend = User::factory()->create();
        $room = $this->makeRoom($owner);
        RoomInvitation::create([
            'room_id' => $room->id, 'inviter_id' => $owner->id,
            'invitee_id' => $friend->id, 'status' => 'pending',
        ]);
        Sanctum::actingAs($friend);

        $res = $this->getJson('/api/room-invitations')->assertOk()->assertJsonPath('count', 1);
        $this->assertSame('Test Room', $res->json('data.0.room.name'));
        $this->assertSame('Inviter', $res->json('data.0.from.name'));
    }

    public function test_accept_adds_member_and_marks_accepted(): void
    {
        $owner  = User::factory()->create();
        $friend = User::factory()->create();
        $room = $this->makeRoom($owner);
        $inv = RoomInvitation::create([
            'room_id' => $room->id, 'inviter_id' => $owner->id,
            'invitee_id' => $friend->id, 'status' => 'pending',
        ]);
        Sanctum::actingAs($friend);

        $this->postJson("/api/room-invitations/{$inv->id}/accept")
            ->assertCreated()->assertJsonPath('id', $room->id);

        $this->assertDatabaseHas('reading_room_members', [
            'room_id' => $room->id, 'user_id' => $friend->id,
        ]);
        $this->assertSame('accepted', $inv->fresh()->status);
        $this->assertSame(2, $room->fresh()->member_count);
    }

    public function test_cannot_accept_someone_elses_invitation(): void
    {
        $owner   = User::factory()->create();
        $friend  = User::factory()->create();
        $intruder = User::factory()->create();
        $room = $this->makeRoom($owner);
        $inv = RoomInvitation::create([
            'room_id' => $room->id, 'inviter_id' => $owner->id,
            'invitee_id' => $friend->id, 'status' => 'pending',
        ]);
        Sanctum::actingAs($intruder);

        $this->postJson("/api/room-invitations/{$inv->id}/accept")->assertStatus(403);
        $this->assertDatabaseMissing('reading_room_members', [
            'room_id' => $room->id, 'user_id' => $intruder->id,
        ]);
    }

    public function test_decline_marks_declined_without_joining(): void
    {
        $owner  = User::factory()->create();
        $friend = User::factory()->create();
        $room = $this->makeRoom($owner);
        $inv = RoomInvitation::create([
            'room_id' => $room->id, 'inviter_id' => $owner->id,
            'invitee_id' => $friend->id, 'status' => 'pending',
        ]);
        Sanctum::actingAs($friend);

        $this->postJson("/api/room-invitations/{$inv->id}/decline")->assertOk();

        $this->assertSame('declined', $inv->fresh()->status);
        $this->assertDatabaseMissing('reading_room_members', [
            'room_id' => $room->id, 'user_id' => $friend->id,
        ]);
    }
}
