<?php

declare(strict_types=1);

use App\Models\ProvisioningBatch;
use App\Models\ProvisioningBatchNode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('GET /api/v1/provisioning/{batch}', function (): void {
    it('superadmin can view a batch with its nodes', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $batch = ProvisioningBatch::factory()->create([
            'submitted_by' => $superadmin->id,
            'total_nodes' => 2,
        ]);
        ProvisioningBatchNode::factory()->count(2)->create([
            'provisioning_batch_id' => $batch->id,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/provisioning/{$batch->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'network',
                    'submitted_by',
                    'status',
                    'total_nodes',
                    'provisioned_nodes',
                    'status_summary',
                    'nodes' => [
                        '*' => ['id', 'service_id', 'node_address', 'status', 'last_command_id', 'created_at'],
                    ],
                    'created_at',
                ],
            ])
            ->assertJsonPath('data.id', $batch->id)
            ->assertJsonCount(2, 'data.nodes');
    });

    it('returns 403 for non-superadmin', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);
        $batch = ProvisioningBatch::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/provisioning/{$batch->id}")
            ->assertStatus(403);
    });

    it('returns 404 for a non-existent batch', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);

        $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/provisioning/99999')
            ->assertStatus(404);
    });
});
