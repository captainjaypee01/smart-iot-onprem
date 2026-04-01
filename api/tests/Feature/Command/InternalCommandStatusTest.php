<?php

declare(strict_types=1);

use App\Enums\MessageStatus;
use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\Network;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config(['app.internal_api_token' => 'test-internal-token']);
});

// ── PATCH /internal/commands/{id}/status ─────────────────────────────────────

describe('PATCH /internal/commands/{id}/status', function (): void {

    it('rejects missing X-Internal-Token', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Pending,
        ]);

        $this->patchJson("/internal/commands/{$command->id}/status", [
            'processing_status' => 3,
        ])
            ->assertStatus(401)
            ->assertJson(['message' => 'Unauthorized']);
    });

    it('rejects wrong X-Internal-Token', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Pending,
        ]);

        $this->withHeader('X-Internal-Token', 'wrong-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => 3,
            ])
            ->assertStatus(401);
    });

    it('returns 404 for non-existent command', function (): void {
        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson('/internal/commands/999999999/status', [
                'processing_status' => 3,
            ])
            ->assertStatus(404);
    });

    it('rejects invalid processing_status values', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create(['network_id' => $network->id]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => 99, // invalid
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['processing_status']);
    });

    it('updates processing_status successfully', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Pending,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => ProcessingStatus::Sent->value,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.processing_status', ProcessingStatus::Sent->value)
            ->assertJsonPath('data.processing_status_label', 'Sent');

        $command->refresh();
        expect($command->processing_status)->toBe(ProcessingStatus::Sent);
    });

    it('updates processing_status and message_status together', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Sent,
            'message_status'    => MessageStatus::WaitingResponse,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => ProcessingStatus::Sent->value,
                'message_status'    => MessageStatus::NodeResponded->value,
            ]);

        $response->assertStatus(200);
        $command->refresh();
        expect($command->message_status)->toBe(MessageStatus::NodeResponded);
    });

    it('sets error_message on failure', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Sent,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => ProcessingStatus::Failed->value,
                'error_message'     => 'Node did not respond',
            ]);

        $response->assertStatus(200);
        $command->refresh();
        expect($command->processing_status)->toBe(ProcessingStatus::Failed)
            ->and($command->error_message)->toBe('Node did not respond');
    });

    it('returns 409 when command is already in terminal Failed state', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->failed()->create([
            'network_id' => $network->id,
        ]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => ProcessingStatus::Sent->value,
            ])
            ->assertStatus(409);
    });

    it('sets completed_at when transitioning to Sent', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Processing,
            'completed_at'      => null,
        ]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => ProcessingStatus::Sent->value,
            ])
            ->assertStatus(200);

        $command->refresh();
        expect($command->completed_at)->not->toBeNull();
    });

    it('sets completed_at when transitioning to Failed', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Processing,
            'completed_at'      => null,
        ]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => ProcessingStatus::Failed->value,
            ])
            ->assertStatus(200);

        $command->refresh();
        expect($command->completed_at)->not->toBeNull();
    });

    it('updates acked_at and dispatched_at when provided', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Pending,
        ]);

        $ackedAt      = '2026-04-01T10:00:05+00:00';
        $dispatchedAt = '2026-04-01T10:00:02+00:00';

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => ProcessingStatus::Sent->value,
                'acked_at'          => $ackedAt,
                'dispatched_at'     => $dispatchedAt,
            ])
            ->assertStatus(200);

        $command->refresh();
        expect($command->acked_at)->not->toBeNull()
            ->and($command->dispatched_at)->not->toBeNull();
    });

    it('returns CommandResource shape with status labels', function (): void {
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id'        => $network->id,
            'processing_status' => ProcessingStatus::Pending,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/commands/{$command->id}/status", [
                'processing_status' => ProcessingStatus::Processing->value,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id', 'type', 'node_address',
                    'processing_status', 'processing_status_label',
                    'message_status', 'message_status_label',
                    'retry_count', 'created_at',
                ],
            ]);
    });
});
