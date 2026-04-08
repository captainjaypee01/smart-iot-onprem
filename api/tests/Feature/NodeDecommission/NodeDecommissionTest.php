<?php

declare(strict_types=1);

use App\Enums\NodeStatus;
use App\Models\Network;
use App\Models\Node;
use App\Models\NodeDecommissionLog;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config(['app.internal_api_token' => 'test-internal-token']);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Create a user with a role that has the given permission key(s).
 *
 * @param  string|list<string>  $permissionKeys
 */
function makeUserWithPermission(string|array $permissionKeys, Network $network): User
{
    $keys = is_array($permissionKeys) ? $permissionKeys : [$permissionKeys];

    $role = Role::factory()->create(['is_system_role' => false]);

    foreach ($keys as $key) {
        $permission = Permission::firstOrCreate(
            ['key' => $key],
            ['module' => explode('.', $key)[0], 'display_name' => $key]
        );
        DB::table('role_permissions')->insert([
            'role_id' => $role->id,
            'permission_id' => $permission->id,
        ]);
    }

    DB::table('role_networks')->insert([
        'role_id' => $role->id,
        'network_id' => $network->id,
    ]);

    return User::factory()->create([
        'is_superadmin' => false,
        'role_id' => $role->id,
    ]);
}

// ── GET /api/v1/node-decommission/nodes ──────────────────────────────────────

describe('GET /api/v1/node-decommission/nodes', function (): void {

    it('returns a list of decommissionable nodes for a network', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::New->value, 'name' => 'Alpha Node']);
        Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::Active->value, 'name' => 'Beta Node']);
        // Decommissioned node should be excluded
        Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::Decommissioned->value, 'name' => 'Gamma Node']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-decommission/nodes?network_id='.$network->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'name', 'node_address', 'service_id', 'status', 'network', 'latest_decommission_log']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $names = collect($response->json('data'))->pluck('name');
        expect($names)->toContain('Alpha Node')
            ->toContain('Beta Node')
            ->not->toContain('Gamma Node');
    });

    it('excludes decommissioned nodes from the list', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::Decommissioned->value]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-decommission/nodes?network_id='.$network->id);

        $response->assertStatus(200);
        expect($response->json('data'))->toBeEmpty();
    });

    it('filters nodes by search term', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        Node::factory()->create(['network_id' => $network->id, 'name' => 'Floor 3 Sensor', 'service_id' => 'SVC-F3']);
        Node::factory()->create(['network_id' => $network->id, 'name' => 'Roof Unit', 'service_id' => 'SVC-RU']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-decommission/nodes?network_id='.$network->id.'&search=Floor');

        $response->assertStatus(200);
        $names = collect($response->json('data'))->pluck('name');
        expect($names)->toContain('Floor 3 Sensor')
            ->not->toContain('Roof Unit');
    });

    it('returns 422 when network_id is missing', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);

        $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-decommission/nodes')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['network_id']);
    });

    it('returns 403 for a user lacking node_decommission.view permission', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);
        $network = Network::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/node-decommission/nodes?network_id='.$network->id)
            ->assertStatus(403);
    });

    it('returns 422 when non-superadmin requests a network not in their role_networks', function (): void {
        $network = Network::factory()->create();
        $otherNetwork = Network::factory()->create();
        $user = makeUserWithPermission('node_decommission.view', $network);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/node-decommission/nodes?network_id='.$otherNetwork->id)
            ->assertStatus(422);
    });

    it('includes latest_decommission_log when a previous attempt exists', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        NodeDecommissionLog::factory()->failed()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-decommission/nodes?network_id='.$network->id);

        $response->assertStatus(200);
        $item = collect($response->json('data'))->firstWhere('id', $node->id);
        expect($item['latest_decommission_log'])->not->toBeNull()
            ->and($item['latest_decommission_log']['status'])->toBe('failed');
    });

    it('returns 401 for unauthenticated requests', function (): void {
        $network = Network::factory()->create();

        $this->getJson('/api/v1/node-decommission/nodes?network_id='.$network->id)
            ->assertStatus(401);
    });
});

// ── GET /api/v1/node-decommission/history ────────────────────────────────────

describe('GET /api/v1/node-decommission/history', function (): void {

    it('returns paginated decommission log history for a network', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        NodeDecommissionLog::factory()->pending()->create(['node_id' => $node->id, 'network_id' => $network->id]);
        NodeDecommissionLog::factory()->failed()->create(['node_id' => $node->id, 'network_id' => $network->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-decommission/history?network_id='.$network->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'node', 'network', 'initiated_by', 'status', 'is_manual', 'packet_id', 'payload',
                    'verification_packet_id', 'verification_sent_at', 'verification_expires_at',
                    'verification_timed_out', 'error_message', 'decommissioned_at', 'created_at', 'updated_at']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        expect($response->json('meta.total'))->toBe(2);
    });

    it('filters history by status', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        NodeDecommissionLog::factory()->pending()->create(['node_id' => $node->id, 'network_id' => $network->id]);
        NodeDecommissionLog::factory()->failed()->create(['node_id' => $node->id, 'network_id' => $network->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-decommission/history?network_id='.$network->id.'&status=failed');

        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(1)
            ->and($response->json('data.0.status'))->toBe('failed');
    });

    it('returns 422 when network_id is missing', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);

        $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-decommission/history')
            ->assertStatus(422);
    });

    it('returns 403 for a user lacking node_decommission.view permission', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);
        $network = Network::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/node-decommission/history?network_id='.$network->id)
            ->assertStatus(403);
    });
});

// ── POST /api/v1/node-decommission/{node}/decommission ───────────────────────

describe('POST /api/v1/node-decommission/{node}/decommission', function (): void {

    it('creates a pending decommission log with hardcoded payload and returns 201', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::Active->value]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/decommission", [
                'network_id' => $network->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.is_manual', false)
            ->assertJsonPath('data.payload', '0e05446f697421');

        expect(NodeDecommissionLog::count())->toBe(1);
    });

    it('returns 409 when an active pending decommission already exists', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/decommission", [
                'network_id' => $network->id,
            ])
            ->assertStatus(409);
    });

    it('returns 422 when node is already decommissioned', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->decommissioned()->create(['network_id' => $network->id]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/decommission", [
                'network_id' => $network->id,
            ])
            ->assertStatus(422);
    });

    it('returns 422 when network_id does not match node network', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $otherNetwork = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/decommission", [
                'network_id' => $otherNetwork->id,
            ])
            ->assertStatus(422);
    });

    it('returns 403 for a user lacking node_decommission.decommission permission', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $user = makeUserWithPermission('node_decommission.view', $network);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/decommission", [
                'network_id' => $network->id,
            ])
            ->assertStatus(403);
    });

    it('uses the hardcoded decommission payload (0e05446f697421)', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/decommission", [
                'network_id' => $network->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.payload', '0e05446f697421');
    });
});

// ── POST /api/v1/node-decommission/{node}/resend ─────────────────────────────

describe('POST /api/v1/node-decommission/{node}/resend', function (): void {

    it('creates a new pending log row (failed row preserved in history)', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $failedLog = NodeDecommissionLog::factory()->failed()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
            'packet_id' => 'aaaa',
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/resend");

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.payload', '0e05446f697421');

        // Old failed row is untouched
        $failedLog->refresh();
        expect($failedLog->status->value)->toBe('failed');

        // A brand new row was created
        expect(NodeDecommissionLog::count())->toBe(2);
    });

    it('returns 404 when no decommission log exists for the node', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/resend")
            ->assertStatus(404);
    });

    it('returns 404 when no failed log exists (only pending log present)', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/resend")
            ->assertStatus(404);
    });

    it('returns 403 for a user lacking node_decommission.verify permission', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $user = makeUserWithPermission('node_decommission.view', $network);

        NodeDecommissionLog::factory()->failed()->create(['node_id' => $node->id, 'network_id' => $network->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/resend")
            ->assertStatus(403);
    });
});

// ── POST /api/v1/node-decommission/{node}/verify ─────────────────────────────

describe('POST /api/v1/node-decommission/{node}/verify', function (): void {

    it('sets verification fields on a pending log', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $log = NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/verify");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'pending');

        $log->refresh();
        expect($log->verification_packet_id)->not->toBeNull()
            ->and($log->verification_sent_at)->not->toBeNull()
            ->and($log->verification_expires_at)->not->toBeNull();
    });

    it('returns 404 when no decommission log exists', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/verify")
            ->assertStatus(404);
    });

    it('returns 404 when no pending log exists for the node', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        NodeDecommissionLog::factory()->failed()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/verify")
            ->assertStatus(404);
    });

    it('returns 403 for a user lacking node_decommission.verify permission', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $user = makeUserWithPermission('node_decommission.view', $network);

        NodeDecommissionLog::factory()->pending()->create(['node_id' => $node->id, 'network_id' => $network->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/verify")
            ->assertStatus(403);
    });
});

// ── POST /api/v1/node-decommission/{node}/manual ─────────────────────────────

describe('POST /api/v1/node-decommission/{node}/manual', function (): void {

    it('creates a manual log and sets node status to decommissioned', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::Active->value]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/manual");

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'manual')
            ->assertJsonPath('data.is_manual', true);

        $node->refresh();
        expect($node->status->value)->toBe('decommissioned');
        expect(NodeDecommissionLog::count())->toBe(1);
    });

    it('returns 422 when node is already decommissioned', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->decommissioned()->create(['network_id' => $network->id]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/manual")
            ->assertStatus(422);
    });

    it('returns 403 for a user lacking node_decommission.manual_decommission permission', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $user = makeUserWithPermission('node_decommission.view', $network);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/manual")
            ->assertStatus(403);
    });

    it('allows manual decommission even when a pending log exists (coexistence)', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);

        NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/node-decommission/{$node->id}/manual")
            ->assertStatus(201);

        expect(NodeDecommissionLog::count())->toBe(2);
    });
});

// ── PATCH /internal/node-decommission/{log}/status ───────────────────────────

describe('PATCH /internal/node-decommission/{log}/status', function (): void {

    it('transitions pending log to completed on decommission+success and sets node to decommissioned', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::Active->value]);
        $log = NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/node-decommission/{$log->id}/status", [
                'result' => 'success',
                'command_type' => 'decommission',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        $log->refresh();
        expect($log->status->value)->toBe('completed')
            ->and($log->decommissioned_at)->not->toBeNull();

        $node->refresh();
        expect($node->status->value)->toBe('decommissioned');
    });

    it('transitions pending log to failed on verify+success (node replied = still alive)', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::Active->value]);
        $log = NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/node-decommission/{$log->id}/status", [
                'result' => 'success',
                'command_type' => 'verify',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'failed');

        $log->refresh();
        expect($log->status->value)->toBe('failed');

        // Node is still active — decommission did not succeed
        $node->refresh();
        expect($node->status->value)->toBe('active');
    });

    it('transitions pending log to failed on error result', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $log = NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/node-decommission/{$log->id}/status", [
                'result' => 'error',
                'command_type' => 'decommission',
                'error_message' => 'Node timeout',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'failed');

        $log->refresh();
        expect($log->status->value)->toBe('failed')
            ->and($log->error_message)->toBe('Node timeout');
    });

    it('is idempotent — completed log returns 200 without mutation on repeat call', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->decommissioned()->create(['network_id' => $network->id]);
        $log = NodeDecommissionLog::factory()->completed()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $originalDecommissionedAt = $log->decommissioned_at;

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/node-decommission/{$log->id}/status", [
                'result' => 'success',
                'command_type' => 'verify',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        $log->refresh();
        expect($log->decommissioned_at->toIso8601String())
            ->toBe($originalDecommissionedAt?->toIso8601String());
    });

    it('returns 409 when log has status manual', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->decommissioned()->create(['network_id' => $network->id]);
        $log = NodeDecommissionLog::factory()->manual()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/node-decommission/{$log->id}/status", [
                'result' => 'success',
                'command_type' => 'verify',
            ])
            ->assertStatus(409);
    });

    it('does not change node status on verify+success (node still alive)', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id, 'status' => NodeStatus::Active->value]);
        $log = NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/node-decommission/{$log->id}/status", [
                'result' => 'success',
                'command_type' => 'verify',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'failed');

        $node->refresh();
        expect($node->status->value)->toBe('active');
    });

    it('returns 401 for missing X-Internal-Token', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $log = NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $this->patchJson("/internal/node-decommission/{$log->id}/status", [
            'result' => 'success',
            'command_type' => 'verify',
        ])->assertStatus(401);
    });

    it('returns 404 for non-existent log id', function (): void {
        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson('/internal/node-decommission/999999/status', [
                'result' => 'success',
                'command_type' => 'verify',
            ])
            ->assertStatus(404);
    });

    it('returns 422 when result field is invalid', function (): void {
        $network = Network::factory()->create();
        $node = Node::factory()->create(['network_id' => $network->id]);
        $log = NodeDecommissionLog::factory()->pending()->create([
            'node_id' => $node->id,
            'network_id' => $network->id,
        ]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/node-decommission/{$log->id}/status", [
                'result' => 'invalid_value',
                'command_type' => 'verify',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['result']);
    });
});
