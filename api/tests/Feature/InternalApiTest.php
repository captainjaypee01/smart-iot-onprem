<?php

use App\Enums\CommandStatus;
use App\Models\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['app.internal_api_token' => 'test-internal-token']);
});

test('internal endpoint rejects missing token', function () {
    $command = Command::factory()->create([
        'status' => CommandStatus::PENDING,
    ]);

    $response = $this->postJson("/internal/commands/{$command->id}/mark-dispatched");

    $response->assertStatus(401)
        ->assertJson(['message' => 'Unauthorized']);
});

test('internal endpoint rejects wrong token', function () {
    $command = Command::factory()->create([
        'status' => CommandStatus::PENDING,
    ]);

    $response = $this->withHeader('X-Internal-Token', 'wrong-token')
        ->postJson("/internal/commands/{$command->id}/mark-dispatched");

    $response->assertStatus(401)
        ->assertJson(['message' => 'Unauthorized']);
});

test('internal endpoint can mark command as dispatched', function () {
    $command = Command::factory()->create([
        'status' => CommandStatus::PENDING,
    ]);

    $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
        ->postJson("/internal/commands/{$command->id}/mark-dispatched");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => ['id', 'status', 'dispatched_at'],
        ]);

    expect($response->json('data.status'))->toBe(CommandStatus::DISPATCHED->value);

    $command->refresh();
    expect($command->status)->toBe(CommandStatus::DISPATCHED)
        ->and($command->dispatched_at)->not->toBeNull();
});

test('internal endpoint can mark command as acked', function () {
    $command = Command::factory()->create([
        'status' => CommandStatus::DISPATCHED,
    ]);

    $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
        ->postJson("/internal/commands/{$command->id}/mark-acked");

    $response->assertStatus(200);

    $command->refresh();
    expect($command->status)->toBe(CommandStatus::ACKED)
        ->and($command->acked_at)->not->toBeNull();
});

test('internal endpoint can mark command as failed', function () {
    $command = Command::factory()->create([
        'status' => CommandStatus::DISPATCHED,
    ]);

    $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
        ->postJson("/internal/commands/{$command->id}/mark-failed", [
            'error_code' => 'DEVICE_OFFLINE',
            'error_message' => 'Device is offline',
        ]);

    $response->assertStatus(200);

    $command->refresh();
    expect($command->status)->toBe(CommandStatus::FAILED)
        ->and($command->error_code)->toBe('DEVICE_OFFLINE')
        ->and($command->error_message)->toBe('Device is offline');
});

test('internal endpoint rejects invalid state transitions', function () {
    $command = Command::factory()->create([
        'status' => CommandStatus::COMPLETED,
    ]);

    $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
        ->postJson("/internal/commands/{$command->id}/mark-dispatched");

    $response->assertStatus(500); // Will throw InvalidArgumentException
});
