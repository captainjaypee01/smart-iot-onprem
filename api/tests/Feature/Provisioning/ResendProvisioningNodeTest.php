<?php

declare(strict_types=1);

use App\Enums\ProvisioningNodeStatus;
use App\Models\Command;
use App\Models\ProvisioningBatch;
use App\Models\ProvisioningBatchNode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('POST /api/v1/provisioning/{batch}/nodes/{node}/resend', function (): void {
    it('superadmin can resend a pending node', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $batch = ProvisioningBatch::factory()->create(['submitted_by' => $superadmin->id]);
        $node = ProvisioningBatchNode::factory()->create([
            'provisioning_batch_id' => $batch->id,
            'status' => ProvisioningNodeStatus::Pending,
            'last_command_id' => null,
        ]);

        $commandCountBefore = Command::count();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/provisioning/{$batch->id}/nodes/{$node->id}/resend");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'service_id', 'node_address', 'status', 'last_command_id', 'created_at'],
            ])
            ->assertJsonPath('data.status', ProvisioningNodeStatus::Pending->value);

        expect(Command::count())->toBe($commandCountBefore + 1);

        $node->refresh();
        expect($node->last_command_id)->not->toBeNull()
            ->and($node->status)->toBe(ProvisioningNodeStatus::Pending);
    });

    it('superadmin can resend a failed node', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $batch = ProvisioningBatch::factory()->create(['submitted_by' => $superadmin->id]);
        $node = ProvisioningBatchNode::factory()->create([
            'provisioning_batch_id' => $batch->id,
            'status' => ProvisioningNodeStatus::Failed,
        ]);

        $commandCountBefore = Command::count();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/provisioning/{$batch->id}/nodes/{$node->id}/resend");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', ProvisioningNodeStatus::Pending->value);

        expect(Command::count())->toBe($commandCountBefore + 1);

        $node->refresh();
        expect($node->status)->toBe(ProvisioningNodeStatus::Pending);
    });

    it('returns 422 when resending an already provisioned node', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $batch = ProvisioningBatch::factory()->create(['submitted_by' => $superadmin->id]);
        $node = ProvisioningBatchNode::factory()->create([
            'provisioning_batch_id' => $batch->id,
            'status' => ProvisioningNodeStatus::Provisioned,
        ]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/provisioning/{$batch->id}/nodes/{$node->id}/resend")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Node has already been provisioned and cannot be resent.');
    });

    it('returns 404 when the node belongs to a different batch', function (): void {
        $superadmin = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $batchA = ProvisioningBatch::factory()->create(['submitted_by' => $superadmin->id]);
        $batchB = ProvisioningBatch::factory()->create(['submitted_by' => $superadmin->id]);
        $node = ProvisioningBatchNode::factory()->create(['provisioning_batch_id' => $batchA->id]);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/provisioning/{$batchB->id}/nodes/{$node->id}/resend")
            ->assertStatus(404);
    });

    it('returns 403 for non-superadmin', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);
        $batch = ProvisioningBatch::factory()->create();
        $node = ProvisioningBatchNode::factory()->create(['provisioning_batch_id' => $batch->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/provisioning/{$batch->id}/nodes/{$node->id}/resend")
            ->assertStatus(403);
    });
});
