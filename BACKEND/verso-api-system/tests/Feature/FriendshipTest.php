<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FriendshipTest extends TestCase
{
    use RefreshDatabase;

    public function test_requires_auth(): void
    {
        $this->getJson('/api/friends')->assertStatus(401);
    }

    public function test_send_friend_request(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/friends/requests', ['user_id' => $other->id])
            ->assertCreated()->assertJsonPath('status', 'request_sent');

        $this->assertDatabaseHas('friendships', [
            'requester_id' => $me->id, 'addressee_id' => $other->id, 'status' => 'pending',
        ]);
    }

    public function test_cannot_friend_self(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/friends/requests', ['user_id' => $me->id])->assertStatus(422);
    }

    public function test_reverse_pending_request_auto_accepts(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        // other already sent ME a request
        Friendship::factory()->create(['requester_id' => $other->id, 'addressee_id' => $me->id, 'status' => 'pending']);
        Sanctum::actingAs($me);

        $this->postJson('/api/friends/requests', ['user_id' => $other->id])
            ->assertOk()->assertJsonPath('status', 'friends');
    }

    public function test_accept_request(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $f = Friendship::factory()->create(['requester_id' => $other->id, 'addressee_id' => $me->id, 'status' => 'pending']);
        Sanctum::actingAs($me);

        $this->postJson("/api/friends/requests/{$f->id}/accept")
            ->assertOk()->assertJsonPath('status', 'friends');
        $this->assertSame('accepted', $f->fresh()->status);
    }

    public function test_only_addressee_can_accept(): void
    {
        $f = Friendship::factory()->create(['status' => 'pending']);
        Sanctum::actingAs(User::factory()->create()); // unrelated user

        $this->postJson("/api/friends/requests/{$f->id}/accept")->assertStatus(403);
    }

    public function test_decline_request_removes_it(): void
    {
        $me = User::factory()->create();
        $f = Friendship::factory()->create(['addressee_id' => $me->id, 'status' => 'pending']);
        Sanctum::actingAs($me);

        $this->postJson("/api/friends/requests/{$f->id}/decline")
            ->assertOk()->assertJsonPath('status', 'none');
        $this->assertDatabaseMissing('friendships', ['id' => $f->id]);
    }

    public function test_index_lists_accepted_friends(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create(['name' => 'Buddy']);
        Friendship::factory()->accepted()->create(['requester_id' => $me->id, 'addressee_id' => $friend->id]);
        Sanctum::actingAs($me);

        $res = $this->getJson('/api/friends')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('Buddy', $res->json('data.0.name'));
    }

    public function test_requests_lists_incoming_pending(): void
    {
        $me = User::factory()->create();
        Friendship::factory()->create(['addressee_id' => $me->id, 'status' => 'pending']);
        Sanctum::actingAs($me);

        $this->getJson('/api/friends/requests')
            ->assertOk()->assertJsonPath('count', 1);
    }

    public function test_unfriend(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create();
        Friendship::factory()->accepted()->create(['requester_id' => $me->id, 'addressee_id' => $friend->id]);
        Sanctum::actingAs($me);

        $this->deleteJson("/api/friends/{$friend->id}")->assertOk()->assertJsonPath('status', 'none');
        $this->assertDatabaseMissing('friendships', ['requester_id' => $me->id, 'addressee_id' => $friend->id]);
    }
}
