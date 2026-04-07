<?php

declare(strict_types=1);

use App\Models\Network;
use App\Models\ProvisioningBatch;
use App\Models\ProvisioningBatchNode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('GET /api/v1/provisioning', function (): void {
    it('superadmin can list batches with paginated shape', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        ProvisioningBatch::factory()->count(3)->create(['submitted_by' => $superadmin->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/provisioning');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id', 'network', 'submitted_by', 'status',
                        'total_nodes', 'provisioned_nodes', 'status_summary', 'created_at',
                    ],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                'links' => ['first', 'next', 'prev', 'last'],
            ]);

        expect($response->json('meta.total'))->toBe(3);
    });

    it('does not include nodes in the list response', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $batch = ProvisioningBatch::factory()->create(['submitted_by' => $superadmin->id]);
        ProvisioningBatchNode::factory()->count(2)->create(['provisioning_batch_id' => $batch->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/provisioning');

        $response->assertStatus(200);

        expect($response->json('data.0'))->not->toHaveKey('nodes');
    });

    it('filters results by network_id', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $networkA = Network::factory()->create();
        $networkB = Network::factory()->create();

        ProvisioningBatch::factory()->count(2)->create(['network_id' => $networkA->id]);
        ProvisioningBatch::factory()->count(3)->create(['network_id' => $networkB->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/provisioning?network_id={$networkA->id}");

        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(2);
    });

    it('filters results by status', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);

        ProvisioningBatch::factory()->create(['status' => 'pending']);
        ProvisioningBatch::factory()->count(2)->create(['status' => 'complete']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/provisioning?status=complete');

        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(2);
    });

    it('returns 403 for non-superadmin', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/provisioning')
            ->assertStatus(403);
    });
});
