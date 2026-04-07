<?php

declare(strict_types=1);

use App\Models\Command;
use App\Models\Network;
use App\Models\ProvisioningBatch;
use App\Models\ProvisioningBatchNode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * Build a valid store payload.
 *
 * @param  array<int, array{service_id: string, node_address: string}>  $nodes
 */
function buildBatchPayload(int $networkId, array $nodes): array
{
    return [
        'network_id' => $networkId,
        'target_node_id' => 'ffffffff',
        'is_auto_register' => false,
        'nodes' => $nodes,
    ];
}

function buildNode(string $serviceId, string $nodeAddress = 'AABBCC0001'): array
{
    return ['service_id' => $serviceId, 'node_address' => $nodeAddress];
}

describe('POST /api/v1/provisioning', function (): void {
    it('superadmin can create a batch with 1 node and returns 201 with correct shape', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/provisioning', buildBatchPayload($network->id, [
                buildNode('SVC-001', 'AABBCC0001'),
            ]));

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'primary' => [
                        'id', 'network', 'submitted_by', 'status',
                        'total_nodes', 'provisioned_nodes', 'status_summary',
                        'nodes', 'created_at',
                    ],
                    'broadcast' => [
                        'id', 'network', 'submitted_by', 'status',
                        'total_nodes', 'provisioned_nodes', 'status_summary',
                        'nodes', 'created_at',
                    ],
                ],
            ]);

        // 2 batches (primary + broadcast), 2 nodes, 2 commands
        expect(ProvisioningBatch::count())->toBe(2)
            ->and(ProvisioningBatchNode::count())->toBe(2)
            ->and(Command::count())->toBe(2);
    });

    it('superadmin can create a batch with 10 nodes', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        $nodes = array_map(
            fn (int $i) => buildNode("SVC-{$i}", strtoupper(substr(sha1((string) $i), 0, 10))),
            range(1, 10)
        );

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/provisioning', buildBatchPayload($network->id, $nodes));

        $response->assertStatus(201);

        // 2 batches, 20 nodes (10 per batch), 20 commands
        expect(ProvisioningBatch::count())->toBe(2)
            ->and(ProvisioningBatchNode::count())->toBe(20)
            ->and(Command::count())->toBe(20);
    });

    it('returns 403 for non-superadmin', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);
        $network = Network::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/provisioning', buildBatchPayload($network->id, [
                buildNode('SVC-001'),
            ]))
            ->assertStatus(403);
    });

    it('returns 401 for unauthenticated requests', function (): void {
        $network = Network::factory()->create();

        $this->postJson('/api/v1/provisioning', buildBatchPayload($network->id, [
            buildNode('SVC-001'),
        ]))->assertStatus(401);
    });

    it('returns 422 when nodes array exceeds 10', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        $nodes = array_map(
            fn (int $i) => buildNode("SVC-{$i}", strtoupper(substr(sha1((string) $i), 0, 10))),
            range(1, 11)
        );

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/provisioning', buildBatchPayload($network->id, $nodes))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nodes']);
    });

    it('returns 422 for duplicate service_id within the batch payload', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/provisioning', buildBatchPayload($network->id, [
                buildNode('SVC-DUPE', 'AABBCC0001'),
                buildNode('SVC-DUPE', 'AABBCC0002'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nodes']);
    });

    it('returns 422 when service_id already exists in the nodes table', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        DB::table('nodes')->insert([
            'network_id' => $network->id,
            'name' => 'Existing Node',
            'node_address' => 'AABBCCDD01',
            'service_id' => 'EXISTING-SVC',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/provisioning', buildBatchPayload($network->id, [
                buildNode('EXISTING-SVC', 'AABBCCDD02'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nodes']);
    });

    it('returns 422 when network_id is missing', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/provisioning', [
                'target_node_id' => 'ffffffff',
                'nodes' => [buildNode('SVC-001')],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['network_id']);
    });

    it('stores node_address as uppercase regardless of input case', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create();

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/provisioning', buildBatchPayload($network->id, [
                ['service_id' => 'SVC-CASE-001', 'node_address' => 'abcdef1234'],
            ]))
            ->assertStatus(201);

        // Both primary and broadcast batch nodes should store uppercase
        expect(ProvisioningBatchNode::where('node_address', 'ABCDEF1234')->count())->toBe(2)
            ->and(ProvisioningBatchNode::where('node_address', 'abcdef1234')->count())->toBe(0);
    });
});
