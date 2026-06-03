<?php

namespace Tests\Feature;

use App\Models\DirectMessage;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DirectMessageTest extends TestCase
{
    use RefreshDatabase;

    /** Create two users that are accepted friends. */
    private function friends(): array
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        Friendship::factory()->accepted()->create(['requester_id' => $a->id, 'addressee_id' => $b->id]);

        return [$a, $b];
    }

    public function test_requires_auth(): void
    {
        $this->getJson('/api/messages')->assertStatus(401);
    }

    public function test_cannot_message_non_friend(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/messages/{$stranger->id}", ['body' => 'hi'])->assertStatus(403);
    }

    public function test_cannot_message_self(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/messages/{$me->id}", ['body' => 'hi'])->assertStatus(422);
    }

    public function test_friends_can_exchange_messages(): void
    {
        [$me, $friend] = $this->friends();
        Sanctum::actingAs($me);

        $this->postJson("/api/messages/{$friend->id}", ['body' => 'Hey friend'])
            ->assertCreated()->assertJsonPath('body', 'Hey friend');

        $this->assertDatabaseHas('direct_messages', [
            'sender_id' => $me->id, 'recipient_id' => $friend->id, 'body' => 'Hey friend',
        ]);
    }

    public function test_thread_marks_incoming_as_read(): void
    {
        [$me, $friend] = $this->friends();
        DirectMessage::factory()->create([
            'sender_id' => $friend->id, 'recipient_id' => $me->id, 'read_at' => null,
        ]);
        Sanctum::actingAs($me);

        $this->getJson("/api/messages/{$friend->id}")
            ->assertOk()->assertJsonStructure(['partner', 'messages']);

        $this->assertDatabaseMissing('direct_messages', [
            'sender_id' => $friend->id, 'recipient_id' => $me->id, 'read_at' => null,
        ]);
    }

    public function test_thread_with_non_friend_forbidden(): void
    {
        $me = User::factory()->create();
        $stranger = User::factory()->create();
        Sanctum::actingAs($me);

        $this->getJson("/api/messages/{$stranger->id}")->assertStatus(403);
    }

    public function test_inbox_lists_conversations_with_unread_count(): void
    {
        [$me, $friend] = $this->friends();
        DirectMessage::factory()->count(2)->create([
            'sender_id' => $friend->id, 'recipient_id' => $me->id, 'read_at' => null,
        ]);
        Sanctum::actingAs($me);

        $this->getJson('/api/messages')
            ->assertOk()
            ->assertJsonPath('unreadTotal', 2)
            ->assertJsonStructure(['data' => [['user', 'lastMessage', 'unread']], 'unreadTotal']);
    }

    public function test_mark_read_endpoint(): void
    {
        [$me, $friend] = $this->friends();
        DirectMessage::factory()->create([
            'sender_id' => $friend->id, 'recipient_id' => $me->id, 'read_at' => null,
        ]);
        Sanctum::actingAs($me);

        $this->postJson("/api/messages/{$friend->id}/read")->assertOk()->assertJson(['ok' => true]);
        $this->assertDatabaseMissing('direct_messages', [
            'sender_id' => $friend->id, 'recipient_id' => $me->id, 'read_at' => null,
        ]);
    }
}
