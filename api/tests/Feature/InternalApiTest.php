<?php

use App\Enums\ProcessingStatus;
use App\Models\Command;

beforeEach(function () {
    config(['app.internal_api_token' => 'test-internal-token']);
});

test('internal endpoint rejects missing token', function () {
    $command = Command::factory()->create();

    $response = $this->patchJson("/internal/commands/{$command->id}/status", [
        'processing_status' => ProcessingStatus::Processing->value,
    ]);

    $response->assertStatus(401)
        ->assertJson(['message' => 'Unauthorized']);
});

test('internal endpoint rejects wrong token', function () {
    $command = Command::factory()->create();

    $response = $this->withHeader('X-Internal-Token', 'wrong-token')
        ->patchJson("/internal/commands/{$command->id}/status", [
            'processing_status' => ProcessingStatus::Processing->value,
        ]);

    $response->assertStatus(401)
        ->assertJson(['message' => 'Unauthorized']);
});

test('internal endpoint can mark command as dispatched', function () {
    $command = Command::factory()->create([
        'processing_status' => ProcessingStatus::Pending,
    ]);

    $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
        ->patchJson("/internal/commands/{$command->id}/status", [
            'processing_status' => ProcessingStatus::Processing->value,
            'dispatched_at'     => now()->toIso8601String(),
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.processing_status', ProcessingStatus::Processing->value);

    $command->refresh();
    expect($command->processing_status)->toBe(ProcessingStatus::Processing);
});

test('internal endpoint can mark command as acked', function () {
    $command = Command::factory()->create([
        'processing_status' => ProcessingStatus::Processing,
    ]);

    $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
        ->patchJson("/internal/commands/{$command->id}/status", [
            'processing_status' => ProcessingStatus::Sent->value,
            'acked_at'          => now()->toIso8601String(),
        ]);

    $response->assertStatus(200);

    $command->refresh();
    expect($command->processing_status)->toBe(ProcessingStatus::Sent);
});

test('internal endpoint can mark command as failed', function () {
    $command = Command::factory()->create([
        'processing_status' => ProcessingStatus::Processing,
    ]);

    $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
        ->patchJson("/internal/commands/{$command->id}/status", [
            'processing_status' => ProcessingStatus::Failed->value,
            'error_message'     => 'Device is offline',
        ]);

    $response->assertStatus(200);

    $command->refresh();
    expect($command->processing_status)->toBe(ProcessingStatus::Failed)
        ->and($command->error_message)->toBe('Device is offline');
});

test('internal endpoint rejects invalid state transitions', function () {
    $command = Command::factory()->failed()->create();

    $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
        ->patchJson("/internal/commands/{$command->id}/status", [
            'processing_status' => ProcessingStatus::Processing->value,
        ]);

    $response->assertStatus(409);
});
