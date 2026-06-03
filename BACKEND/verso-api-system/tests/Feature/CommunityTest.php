<?php

namespace Tests\Feature;

use App\Models\CommunityMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    public function test_info_requires_auth(): void
    {
        $this->getJson('/api/community/info')->assertStatus(401);
    }

    public function test_info_returns_member_and_online_counts(): void
    {
        User::factory()->count(3)->create(['last_seen_at' => now()]);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/community/info')
            ->assertOk()
            ->assertJsonStructure(['name', 'description', 'memberCount', 'onlineCount']);
    }

    public function test_index_returns_top_level_messages(): void
    {
        $me = User::factory()->create();
        CommunityMessage::factory()->count(3)->create();
        Sanctum::actingAs($me);

        $this->getJson('/api/community/messages')
            ->assertOk()->assertJsonStructure(['messages' => [['id', 'type', 'body', 'author', 'reactions']]]);
    }

    public function test_store_text_message(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/community/messages', ['type' => 'text', 'body' => 'Hello world'])
            ->assertCreated()
            ->assertJsonPath('body', 'Hello world')
            ->assertJsonPath('isSpoiler', false);
    }

    public function test_text_message_requires_body(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/community/messages', ['type' => 'text'])->assertStatus(422);
    }

    public function test_self_tagged_spoiler_is_flagged(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/community/messages', ['type' => 'text', 'body' => 'Snape dies', 'is_spoiler' => true])
            ->assertCreated()->assertJsonPath('isSpoiler', true);
    }

    public function test_store_image_message(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->post('/api/community/messages', ['type' => 'image', 'image' => $this->fakeImage('pic.jpg')])
            ->assertCreated()->assertJsonPath('type', 'image');
    }

    public function test_reply_to_message(): void
    {
        $me = User::factory()->create();
        $parent = CommunityMessage::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson('/api/community/messages', ['type' => 'text', 'body' => 'A reply', 'parent_id' => $parent->id])
            ->assertCreated()->assertJsonPath('parentId', $parent->id);
    }

    public function test_cannot_reply_to_a_reply(): void
    {
        $me = User::factory()->create();
        $parent = CommunityMessage::factory()->create();
        $reply = CommunityMessage::factory()->create(['parent_id' => $parent->id]);
        Sanctum::actingAs($me);

        $this->postJson('/api/community/messages', ['type' => 'text', 'body' => 'nested', 'parent_id' => $reply->id])
            ->assertStatus(422);
    }

    public function test_author_can_edit_own_message(): void
    {
        $me = User::factory()->create();
        $msg = CommunityMessage::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->patchJson("/api/community/messages/{$msg->id}", ['body' => 'edited'])
            ->assertOk()->assertJsonPath('body', 'edited');
    }

    public function test_cannot_edit_others_message(): void
    {
        $msg = CommunityMessage::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/community/messages/{$msg->id}", ['body' => 'x'])->assertStatus(403);
    }

    public function test_author_can_delete_own_message(): void
    {
        $me = User::factory()->create();
        $msg = CommunityMessage::factory()->create(['user_id' => $me->id]);
        Sanctum::actingAs($me);

        $this->deleteJson("/api/community/messages/{$msg->id}")->assertOk();
        $this->assertSoftDeleted('community_messages', ['id' => $msg->id]);
    }

    public function test_cannot_delete_others_message(): void
    {
        $msg = CommunityMessage::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/community/messages/{$msg->id}")->assertStatus(403);
    }

    public function test_toggle_reaction(): void
    {
        $me = User::factory()->create();
        $msg = CommunityMessage::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/community/messages/{$msg->id}/reactions", ['emoji' => '👍'])
            ->assertOk()->assertJsonPath('added', true);
        $this->assertDatabaseHas('community_reactions', ['message_id' => $msg->id, 'user_id' => $me->id, 'emoji' => '👍']);

        $this->postJson("/api/community/messages/{$msg->id}/reactions", ['emoji' => '👍'])
            ->assertOk()->assertJsonPath('added', false);
        $this->assertDatabaseMissing('community_reactions', ['message_id' => $msg->id, 'user_id' => $me->id, 'emoji' => '👍']);
    }

    public function test_reaction_rejects_unknown_emoji(): void
    {
        $me = User::factory()->create();
        $msg = CommunityMessage::factory()->create();
        Sanctum::actingAs($me);

        $this->postJson("/api/community/messages/{$msg->id}/reactions", ['emoji' => '🚀'])
            ->assertStatus(422)->assertJsonValidationErrors(['emoji']);
    }
}
