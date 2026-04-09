<?php

declare(strict_types=1);

use App\Models\Gateway;
use App\Models\Network;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Helpers ───────────────────────────────────────────────────────────────────

function gatewaySuperadmin(): User
{
    return User::factory()->create([
        'is_superadmin' => true,
        'company_id' => null,
        'role_id' => null,
    ]);
}

function gatewayNonSuperadmin(): User
{
    return User::factory()->create([
        'is_superadmin' => false,
    ]);
}

// ── GET /api/v1/gateways ──────────────────────────────────────────────────────

describe('GET /api/v1/gateways', function (): void {

    it('superadmin can list gateways', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'LIST01']);

        foreach (['01', '02', '03'] as $i => $sinkId) {
            Gateway::factory()->create([
                'network_id' => $network->id,
                'sink_id' => $sinkId,
                'gateway_id' => 'LIST01_'.$sinkId,
            ]);
        }

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/gateways');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id', 'gateway_id', 'sink_id', 'name', 'description',
                        'is_test_mode', 'status', 'last_seen_at',
                        'created_at', 'updated_at',
                    ],
                ],
                'meta',
                'links',
            ]);
    });

    it('superadmin can filter gateways by network', function (): void {
        $user = gatewaySuperadmin();
        $networkA = Network::factory()->create(['gateway_prefix' => 'NETA01']);
        $networkB = Network::factory()->create(['gateway_prefix' => 'NETB01']);

        Gateway::factory()->create([
            'network_id' => $networkA->id,
            'gateway_id' => 'NETA01_01',
            'sink_id' => '01',
        ]);
        Gateway::factory()->create([
            'network_id' => $networkB->id,
            'gateway_id' => 'NETB01_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/gateways?network_id={$networkA->id}");

        $response->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->all();

        expect(count($ids))->toBe(1)
            ->and($response->json('data.0.gateway_id'))->toBe('NETA01_01');
    });

    it('superadmin can filter gateways by test mode', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'TEST01']);

        Gateway::factory()->testMode()->create([
            'network_id' => $network->id,
            'gateway_id' => 'TEST01_01',
            'sink_id' => '01',
        ]);
        Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'TEST01_02',
            'sink_id' => '02',
            'is_test_mode' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/gateways?is_test_mode=1');

        $response->assertStatus(200);

        $data = $response->json('data');
        expect(count($data))->toBe(1)
            ->and($data[0]['is_test_mode'])->toBeTrue();
    });

    it('superadmin can filter gateways by status unknown', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'UNK001']);

        // last_seen_at = null → unknown
        Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'UNK001_01',
            'sink_id' => '01',
            'last_seen_at' => null,
        ]);
        // online gateway should not appear
        Gateway::factory()->online()->create([
            'network_id' => $network->id,
            'gateway_id' => 'UNK001_02',
            'sink_id' => '02',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/gateways?status=unknown');

        $response->assertStatus(200);

        $data = $response->json('data');
        expect(count($data))->toBe(1)
            ->and($data[0]['status'])->toBe('unknown');
    });

    it('non-superadmin cannot list gateways', function (): void {
        $user = gatewayNonSuperadmin();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/gateways')
            ->assertStatus(403);
    });

});

// ── GET /api/v1/gateways/{id} ─────────────────────────────────────────────────

describe('GET /api/v1/gateways/{id}', function (): void {

    it('superadmin can view single gateway', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'SHOW01']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'SHOW01_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/gateways/{$gateway->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id', 'gateway_id', 'sink_id', 'name', 'description',
                    'is_test_mode', 'status', 'last_seen_at',
                    'created_at', 'updated_at',
                ],
            ])
            ->assertJsonPath('data.id', $gateway->id)
            ->assertJsonPath('data.gateway_id', 'SHOW01_01');
    });

    it('response includes network relation', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create([
            'gateway_prefix' => 'NET001',
            'name' => 'Building Alpha',
            'network_address' => 'A1B2C3',
        ]);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'NET001_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/gateways/{$gateway->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.network.id', $network->id)
            ->assertJsonPath('data.network.name', 'Building Alpha')
            ->assertJsonPath('data.network.network_address', 'A1B2C3');
    });

    it('response status is unknown when last_seen_at is null', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'UNK002']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'UNK002_01',
            'sink_id' => '01',
            'last_seen_at' => null,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/gateways/{$gateway->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'unknown')
            ->assertJsonPath('data.last_seen_at', null);
    });

    it('response status is online when last seen recently', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'ONL001']);

        $gateway = Gateway::factory()->online()->create([
            'network_id' => $network->id,
            'gateway_id' => 'ONL001_01',
            'sink_id' => '01',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/gateways/{$gateway->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'online');
    });

    it('response status is offline when last seen too long ago', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'OFF001']);

        $gateway = Gateway::factory()->offline()->create([
            'network_id' => $network->id,
            'gateway_id' => 'OFF001_01',
            'sink_id' => '01',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/gateways/{$gateway->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'offline');
    });

    it('show returns 404 for soft-deleted gateway', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'DEL001']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'DEL001_01',
            'sink_id' => '01',
        ]);
        $gateway->delete();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/gateways/{$gateway->id}")
            ->assertStatus(404);
    });

});

// ── POST /api/v1/gateways ─────────────────────────────────────────────────────

describe('POST /api/v1/gateways', function (): void {

    it('superadmin can create first gateway for a network', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => null]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Gateway Floor 1',
                'description' => 'Lobby area',
                'gateway_prefix' => 'ABC123',
                'service_id' => 'SVC001',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.gateway_id', 'ABC123_01')
            ->assertJsonPath('data.sink_id', '01');

        $network->refresh();
        expect($network->gateway_prefix)->toBe('ABC123');
    });

    it('second gateway in same network gets sink_id 02', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'XYZ999']);

        // First gateway already exists in the DB
        Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'XYZ999_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Gateway Floor 2',
                'service_id' => 'SVC002',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.sink_id', '02')
            ->assertJsonPath('data.gateway_id', 'XYZ999_02');
    });

    it('gateway prefix is reused for same network on second gateway', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'REUSE1']);

        Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'REUSE1_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Second Gateway',
                // Supply a different prefix — should be silently ignored
                'gateway_prefix' => 'IGNORED',
                'service_id' => 'SVC003',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.gateway_id', 'REUSE1_02');
    });

    it('gateway prefix is required when network has none', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => null]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Gateway A',
                // no gateway_prefix supplied
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['gateway_prefix']);
    });

    it('gateway prefix regex validation rejects lowercase or symbols', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => null]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Gateway A',
                'gateway_prefix' => 'abc-!#',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['gateway_prefix']);
    });

    it('gateway prefix max length validation rejects prefix over 10 chars', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => null]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Gateway A',
                'gateway_prefix' => 'ABCDEFGHIJK', // 11 chars
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['gateway_prefix']);
    });

    it('gateway prefix must be globally unique across networks', function (): void {
        $user = gatewaySuperadmin();
        $existingNet = Network::factory()->create(['gateway_prefix' => 'TAKEN1']);
        $newNet = Network::factory()->create(['gateway_prefix' => null]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $newNet->id,
                'name' => 'Gateway B',
                'gateway_prefix' => 'TAKEN1',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['gateway_prefix']);
    });

    it('create returns 201 with correct shape', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => null]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Gateway Shape Test',
                'description' => 'Testing response shape',
                'gateway_prefix' => 'SHAPE1',
                'service_id' => 'SVC004',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id', 'gateway_id', 'sink_id', 'network',
                    'name', 'description', 'is_test_mode',
                    'status', 'last_seen_at', 'created_at', 'updated_at',
                ],
            ])
            ->assertJsonPath('data.name', 'Gateway Shape Test')
            ->assertJsonPath('data.description', 'Testing response shape')
            ->assertJsonPath('data.is_test_mode', false)
            ->assertJsonPath('data.status', 'unknown');
    });

    it('non-superadmin cannot create a gateway', function (): void {
        $user = gatewayNonSuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => null]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Gateway A',
                'gateway_prefix' => 'NOPERM',
                'service_id' => 'SVC005',
            ])
            ->assertStatus(403);
    });

});

// ── PATCH /api/v1/gateways/{id} ───────────────────────────────────────────────

describe('PATCH /api/v1/gateways/{id}', function (): void {

    it('superadmin can update gateway name and description', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'UPD001']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'UPD001_01',
            'sink_id' => '01',
            'name' => 'Original Name',
            'description' => 'Original description',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/gateways/{$gateway->id}", [
                'name' => 'Updated Name',
                'description' => 'Updated description',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.description', 'Updated description');

        $gateway->refresh();
        expect($gateway->name)->toBe('Updated Name')
            ->and($gateway->description)->toBe('Updated description');
    });

    it('can toggle test mode via update', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'TGL001']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'TGL001_01',
            'sink_id' => '01',
            'is_test_mode' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/gateways/{$gateway->id}", [
                'is_test_mode' => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.is_test_mode', true);

        $gateway->refresh();
        expect($gateway->is_test_mode)->toBeTrue();
    });

    it('gateway_id cannot be changed via update', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'IMM001']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'IMM001_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/gateways/{$gateway->id}", [
                'name' => 'New Name',
                'gateway_id' => 'HACKED_01', // should be ignored
            ]);

        // Update itself succeeds
        $response->assertStatus(200);

        $gateway->refresh();
        expect($gateway->gateway_id)->toBe('IMM001_01');
    });

    it('non-superadmin cannot update a gateway', function (): void {
        $user = gatewayNonSuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'NOUPD1']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'NOUPD1_01',
            'sink_id' => '01',
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/gateways/{$gateway->id}", ['name' => 'New Name'])
            ->assertStatus(403);
    });

});

// ── DELETE /api/v1/gateways/{id} ──────────────────────────────────────────────

describe('DELETE /api/v1/gateways/{id}', function (): void {

    it('superadmin can soft-delete a gateway', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'SDEL01']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'SDEL01_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/gateways/{$gateway->id}");

        $response->assertStatus(204);

        $this->assertDatabaseHas('gateways', [
            'id' => $gateway->id,
        ]);

        $gateway->refresh();
        expect($gateway->deleted_at)->not->toBeNull();
    });

    it('soft-deleted gateway is not returned in list', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'SLIST1']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'SLIST1_01',
            'sink_id' => '01',
        ]);
        $gateway->delete();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/gateways');

        $response->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->all();
        expect($ids)->not->toContain($gateway->id);
    });

    it('soft-deleted gateway returns 404 on show', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'S404A1']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'S404A1_01',
            'sink_id' => '01',
        ]);
        $gateway->delete();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/gateways/{$gateway->id}")
            ->assertStatus(404);
    });

    it('sink_id counter skips soft-deleted gateways', function (): void {
        $user = gatewaySuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'SKIP01']);

        // Create and then delete the first gateway
        $first = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'SKIP01_01',
            'sink_id' => '01',
        ]);
        $first->delete();

        // Creating a new gateway should pick sink_id "02" (count of all incl. deleted = 1, so next = 2)
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/gateways', [
                'network_id' => $network->id,
                'name' => 'Gateway After Delete',
                'service_id' => 'SVC006',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.sink_id', '02')
            ->assertJsonPath('data.gateway_id', 'SKIP01_02');
    });

    it('non-superadmin cannot delete a gateway', function (): void {
        $user = gatewayNonSuperadmin();
        $network = Network::factory()->create(['gateway_prefix' => 'NDEL01']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'NDEL01_01',
            'sink_id' => '01',
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/gateways/{$gateway->id}")
            ->assertStatus(403);
    });

});
