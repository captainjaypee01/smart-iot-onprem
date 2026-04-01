<?php

declare(strict_types=1);

use App\Enums\MessageStatus;
use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\Network;
use App\Models\NodeType;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Create a non-superadmin user with `command.view` and `command.create` permissions,
 * optionally attached to the given networks.
 *
 * @param  list<int>  $networkIds
 */
function createCommandUser(array $networkIds = []): User
{
    $viewPermission   = Permission::firstOrCreate(
        ['key' => 'command.view'],
        ['display_name' => 'View Commands', 'module' => 'command']
    );
    $createPermission = Permission::firstOrCreate(
        ['key' => 'command.create'],
        ['display_name' => 'Create Commands', 'module' => 'command']
    );

    $role = Role::factory()->create();
    $role->permissions()->sync([$viewPermission->id, $createPermission->id]);

    if (! empty($networkIds)) {
        $role->networks()->sync($networkIds);
    }

    return User::factory()->create([
        'is_superadmin' => false,
        'role_id'       => $role->id,
    ]);
}

/**
 * Minimum valid POST /api/v1/commands payload.
 */
function validCommandPayload(int $networkId, array $overrides = []): array
{
    return array_merge([
        'network_id'          => $networkId,
        'node_address'        => 'A3F2B1',
        'source_ep'           => 10,
        'dest_ep'             => 1,
        'payload'             => 'DEADBEEF',
        'include_tracking_id' => 'manual',
        'packet_id'           => 'AB12',
    ], $overrides);
}

// ── POST /api/v1/commands ─────────────────────────────────────────────────────

describe('POST /api/v1/commands', function (): void {

    it('requires authentication', function (): void {
        $network = Network::factory()->create();

        $this->postJson('/api/v1/commands', validCommandPayload($network->id))
            ->assertStatus(401);
    });

    it('returns 403 when user lacks command.create permission', function (): void {
        $network = Network::factory()->create();
        $user    = User::factory()->create(['is_superadmin' => false]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id))
            ->assertStatus(403);
    });

    it('superadmin can create a send_data command', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id));

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id', 'network', 'created_by', 'type', 'node_address',
                    'request_id', 'source_ep', 'dest_ep', 'payload',
                    'no_packet_id', 'packet_id',
                    'processing_status', 'processing_status_label',
                    'message_status', 'message_status_label',
                    'retry_count', 'retry_at', 'retry_by', 'error_message',
                    'requested_at', 'created_at',
                ],
            ]);

        expect($response->json('data.type'))->toBe('send_data')
            ->and($response->json('data.processing_status'))->toBe(ProcessingStatus::Pending->value)
            ->and($response->json('data.processing_status_label'))->toBe('Pending')
            ->and($response->json('data.no_packet_id'))->toBeFalse()
            ->and($response->json('data.node_address'))->toBe('A3F2B1');
    });

    it('stores node_address as uppercase', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'a3f2b1',
            ]));

        $response->assertStatus(201);
        expect($response->json('data.node_address'))->toBe('A3F2B1');
    });

    it('sets no_packet_id=true when include_tracking_id=none and nullifies packet_id', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'include_tracking_id' => 'none',
                'packet_id'           => null,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.no_packet_id'))->toBeTrue()
            ->and($response->json('data.packet_id'))->toBeNull();
    });

    it('auto-generates request_id in the expected range', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id));

        $response->assertStatus(201);
        $requestId = $response->json('data.request_id');
        expect($requestId)->toBeInt()
            ->and($requestId)->toBeGreaterThanOrEqual(100_000_000)
            ->and($requestId)->toBeLessThanOrEqual(4_294_967_295);
    });

    it('writes an outbox event atomically on create', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id));

        $response->assertStatus(201);
        $commandId = $response->json('data.id');

        $outbox = \App\Models\OutboxEvent::where('aggregate_id', $commandId)->first();
        expect($outbox)->not->toBeNull()
            ->and($outbox->event_name)->toBe('command.send_data.created')
            ->and($outbox->payload['command_id'])->toBe($commandId);
    });

    it('rejects missing required fields', function (): void {
        $superadmin = createSuperadmin();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['network_id', 'node_address', 'include_tracking_id']);
    });

    it('rejects invalid node_address (non-hex characters)', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'ZZZZZZ',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['node_address']);
    });

    it('rejects node_address exceeding 10 characters', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'ABCDEF12345', // 11 chars
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['node_address']);
    });

    it('rejects packet_id that is not exactly 4 hex characters', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'include_tracking_id' => 'manual',
                'packet_id'           => 'AB', // only 2 chars
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['packet_id']);
    });

    it('requires packet_id when include_tracking_id is manual', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'include_tracking_id' => 'manual',
                'packet_id'           => null,
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['packet_id']);
    });

    it('rejects non-hex payload', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'payload' => 'not-hex!',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payload']);
    });

    it('rejects network_id not in user accessible networks for non-superadmin', function (): void {
        $network      = Network::factory()->create();
        $otherNetwork = Network::factory()->create();
        $user         = createCommandUser([$network->id]); // only has access to $network

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($otherNetwork->id))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['network_id']);
    });

    it('allows non-superadmin to send to their accessible network', function (): void {
        $network = Network::factory()->create();
        $user    = createCommandUser([$network->id]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id));

        $response->assertStatus(201);
        expect($response->json('data.created_by.id'))->toBe($user->id);
    });

    // ── Message Status Classification tests ───────────────────────────────────

    it('classifies dest_ep=9 as AlarmAcknowledge', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'dest_ep'      => 9,
                'node_address' => 'A3F2B1',
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::AlarmAcknowledge->value)
            ->and($response->json('data.message_status_label'))->toBe('Alarm Acknowledge');
    });

    it('classifies FFFFFFFF as NetworkMessage', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'FFFFFFFF',
                'dest_ep'      => 1,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::NetworkMessage->value)
            ->and($response->json('data.message_status_label'))->toBe('Network Message');
    });

    it('classifies FFFFFFFE as SinkMessage', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'FFFFFFFE',
                'dest_ep'      => 1,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::SinkMessage->value)
            ->and($response->json('data.message_status_label'))->toBe('Sink Message');
    });

    it('classifies 80XXXXFF as ZoneMessage', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => '80AABBFF',
                'dest_ep'      => 1,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::ZoneMessage->value)
            ->and($response->json('data.message_status_label'))->toBe('Zone Message');
    });

    it('classifies 80XXXXAA (starts 80, not ends FF) as ZoneGroupMessage', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => '80AABB01',
                'dest_ep'      => 1,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::ZoneGroupMessage->value)
            ->and($response->json('data.message_status_label'))->toBe('Zone Group Message');
    });

    it('classifies node_address matching node_types.area_id as GroupMessage', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        // Create a NodeType with area_id matching the node_address
        NodeType::factory()->create(['area_id' => 'AABBCC']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'AABBCC',
                'dest_ep'      => 1,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::GroupMessage->value)
            ->and($response->json('data.message_status_label'))->toBe('Group Message');
    });

    it('classifies area_id match as GroupMessage case-insensitively', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        NodeType::factory()->create(['area_id' => 'aabbcc']); // lowercase in DB

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'AABBCC', // uppercase input
                'dest_ep'      => 1,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::GroupMessage->value);
    });

    it('classifies default address as WaitingResponse', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'A3F2B1',
                'dest_ep'      => 1,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::WaitingResponse->value)
            ->and($response->json('data.message_status_label'))->toBe('Waiting for Response from Node');
    });

    it('AlarmAcknowledge takes priority over NetworkMessage (dest_ep=9 wins)', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        // Even though node_address is FFFFFFFF (NetworkMessage), dest_ep=9 should win
        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands', validCommandPayload($network->id, [
                'node_address' => 'FFFFFFFF',
                'dest_ep'      => 9,
            ]));

        $response->assertStatus(201);
        expect($response->json('data.message_status'))->toBe(MessageStatus::AlarmAcknowledge->value);
    });
});

// ── GET /api/v1/commands ──────────────────────────────────────────────────────

describe('GET /api/v1/commands', function (): void {

    it('requires authentication', function (): void {
        $this->getJson('/api/v1/commands')
            ->assertStatus(401);
    });

    it('returns 403 when user lacks command.view permission', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/commands')
            ->assertStatus(403);
    });

    it('superadmin sees all commands across all networks', function (): void {
        $superadmin = createSuperadmin();
        $network1   = Network::factory()->create();
        $network2   = Network::factory()->create();

        Command::factory()->create(['network_id' => $network1->id, 'type' => 'send_data']);
        Command::factory()->create(['network_id' => $network2->id, 'type' => 'send_data']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/commands');

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('non-superadmin only sees commands from their accessible networks', function (): void {
        $network1 = Network::factory()->create();
        $network2 = Network::factory()->create();

        $user = createCommandUser([$network1->id]); // only has access to network1

        Command::factory()->create(['network_id' => $network1->id, 'type' => 'send_data']);
        Command::factory()->create(['network_id' => $network2->id, 'type' => 'send_data']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/commands');

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(1);
        expect($response->json('data.0.network.id'))->toBe($network1->id);
    });

    it('excludes node_provisioning commands from the list', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        Command::factory()->create(['network_id' => $network->id, 'type' => 'send_data']);
        Command::factory()->provisioning()->create(['network_id' => $network->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/commands');

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(1);
        expect($response->json('data.0.type'))->toBe('send_data');
    });

    it('returns paginated results with meta and links', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        Command::factory()->count(5)->create(['network_id' => $network->id, 'type' => 'send_data']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/commands?per_page=3');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta', 'links']);

        expect($response->json('meta.per_page'))->toBe(3)
            ->and($response->json('meta.total'))->toBe(5)
            ->and($response->json('data'))->toHaveCount(3);
    });

    it('filters by network_id', function (): void {
        $superadmin = createSuperadmin();
        $network1   = Network::factory()->create();
        $network2   = Network::factory()->create();

        Command::factory()->count(2)->create(['network_id' => $network1->id, 'type' => 'send_data']);
        Command::factory()->count(3)->create(['network_id' => $network2->id, 'type' => 'send_data']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/commands?network_id={$network1->id}");

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(2);
    });

    it('filters by processing_status', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        Command::factory()->create([
            'network_id'        => $network->id,
            'type'              => 'send_data',
            'processing_status' => ProcessingStatus::Pending,
        ]);
        Command::factory()->create([
            'network_id'        => $network->id,
            'type'              => 'send_data',
            'processing_status' => ProcessingStatus::Sent,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/commands?processing_status=' . ProcessingStatus::Pending->value);

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(1)
            ->and($response->json('data.0.processing_status'))->toBe(ProcessingStatus::Pending->value);
    });

    it('filters by message_status', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        Command::factory()->create([
            'network_id'     => $network->id,
            'type'           => 'send_data',
            'message_status' => MessageStatus::WaitingResponse,
        ]);
        Command::factory()->create([
            'network_id'     => $network->id,
            'type'           => 'send_data',
            'message_status' => MessageStatus::AlarmAcknowledge,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/commands?message_status=' . MessageStatus::AlarmAcknowledge->value);

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(1)
            ->and($response->json('data.0.message_status'))->toBe(MessageStatus::AlarmAcknowledge->value);
    });

    it('filters by node_address case-insensitively', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        Command::factory()->create([
            'network_id'   => $network->id,
            'type'         => 'send_data',
            'node_address' => 'A3F2B1',
        ]);
        Command::factory()->create([
            'network_id'   => $network->id,
            'type'         => 'send_data',
            'node_address' => 'BBBBBB',
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/commands?node_address=a3f2b1'); // lowercase query

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(1)
            ->and($response->json('data.0.node_address'))->toBe('A3F2B1');
    });

    it('filters by date_from and date_to', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        Command::factory()->create([
            'network_id' => $network->id,
            'type'       => 'send_data',
            'created_at' => '2026-03-01 12:00:00',
        ]);
        Command::factory()->create([
            'network_id' => $network->id,
            'type'       => 'send_data',
            'created_at' => '2026-04-01 12:00:00',
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/commands?date_from=2026-04-01&date_to=2026-04-30');

        $response->assertStatus(200);
        expect($response->json('data'))->toHaveCount(1);
    });

    it('returns results sorted by created_at DESC', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $older = Command::factory()->create([
            'network_id' => $network->id,
            'type'       => 'send_data',
            'created_at' => now()->subHours(2),
        ]);
        $newer = Command::factory()->create([
            'network_id' => $network->id,
            'type'       => 'send_data',
            'created_at' => now(),
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/commands');

        $response->assertStatus(200);
        expect($response->json('data.0.id'))->toBe($newer->id);
        expect($response->json('data.1.id'))->toBe($older->id);
    });
});

// ── GET /api/v1/commands/{command} ───────────────────────────────────────────

describe('GET /api/v1/commands/{command}', function (): void {

    it('superadmin can fetch a single command by ID', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $command = Command::factory()->create([
            'network_id' => $network->id,
            'type'       => 'send_data',
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/commands/{$command->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $command->id);
    });

    it('returns 403 for a user on a different network', function (): void {
        $ownNetwork   = Network::factory()->create();
        $otherNetwork = Network::factory()->create();
        $user         = createCommandUser([$ownNetwork->id]); // no access to otherNetwork

        $command = Command::factory()->create([
            'network_id' => $otherNetwork->id,
            'type'       => 'send_data',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/commands/{$command->id}")
            ->assertStatus(403);
    });
});

// ── POST /api/v1/commands/{command}/resend ────────────────────────────────────

describe('POST /api/v1/commands/{command}/resend', function (): void {

    it('returns 404 for non-existent command', function (): void {
        $superadmin = createSuperadmin();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/commands/999999999/resend')
            ->assertStatus(404);
    });

    it('returns 403 when user lacks command.create permission', function (): void {
        $network = Network::factory()->create();
        $user    = User::factory()->create(['is_superadmin' => false]);
        $command = Command::factory()->create(['network_id' => $network->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend")
            ->assertStatus(403);
    });

    it('returns 403 when user tries to resend another user\'s command', function (): void {
        $network      = Network::factory()->create();
        $owner        = createCommandUser([$network->id]);
        $otherUser    = createCommandUser([$network->id]);

        $command = Command::factory()->create([
            'network_id' => $network->id,
            'type'       => 'send_data',
            'created_by' => $owner->id,
        ]);

        $this->actingAs($otherUser, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend")
            ->assertStatus(403);
    });

    it('allows command creator to resend their own command', function (): void {
        $network = Network::factory()->create();
        $user    = createCommandUser([$network->id]);

        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'type'              => 'send_data',
            'created_by'        => $user->id,
            'retry_count'       => 0,
            'processing_status' => ProcessingStatus::Sent,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend");

        $response->assertStatus(200);
        expect($response->json('data.retry_count'))->toBe(1)
            ->and($response->json('data.processing_status'))->toBe(ProcessingStatus::Pending->value);
    });

    it('superadmin can resend any command', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();
        $otherUser  = User::factory()->create();

        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'type'              => 'send_data',
            'created_by'        => $otherUser->id,
            'retry_count'       => 0,
            'processing_status' => ProcessingStatus::Pending,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend");

        $response->assertStatus(200);
        expect($response->json('data.retry_count'))->toBe(1);
    });

    it('returns 422 when retry_count >= 3', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $command = Command::factory()->failed()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Pending, // not Failed, but max retries
            'retry_count'       => 3,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend")
            ->assertStatus(422);
    });

    it('returns 422 when processing_status is Failed', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'type'              => 'send_data',
            'processing_status' => ProcessingStatus::Failed,
            'retry_count'       => 1,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend")
            ->assertStatus(422);
    });

    it('returns 422 when command type is not send_data', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $command = Command::factory()->provisioning()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Pending,
            'retry_count'       => 0,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend")
            ->assertStatus(422);
    });

    it('increments retry_count, sets retry_by, and resets processing_status to Pending', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'type'              => 'send_data',
            'created_by'        => $superadmin->id,
            'processing_status' => ProcessingStatus::Sent,
            'retry_count'       => 1,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend");

        $response->assertStatus(200);

        $command->refresh();
        expect($command->retry_count)->toBe(2)
            ->and($command->retry_by)->toBe($superadmin->id)
            ->and($command->retry_at)->not->toBeNull()
            ->and($command->processing_status)->toBe(ProcessingStatus::Pending);
    });

    it('writes outbox event on resend', function (): void {
        $superadmin = createSuperadmin();
        $network    = Network::factory()->create();

        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'type'              => 'send_data',
            'processing_status' => ProcessingStatus::Pending,
            'retry_count'       => 0,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/commands/{$command->id}/resend")
            ->assertStatus(200);

        $outboxEvent = \App\Models\OutboxEvent::where('aggregate_id', $command->id)
            ->where('event_name', 'command.send_data.resend')
            ->first();

        expect($outboxEvent)->not->toBeNull()
            ->and($outboxEvent->payload['command_id'])->toBe($command->id);
    });
});
