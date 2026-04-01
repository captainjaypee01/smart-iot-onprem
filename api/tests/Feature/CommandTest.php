<?php

use App\Enums\CommandStatus;
use App\Models\Command;
use App\Models\Network;
use App\Models\OutboxEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can create a command', function () {
    $user = User::factory()->create();
    $network = Network::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/v1/commands', [
        'network_id' => $network->id,
        'type' => 'set_temperature',
        'device_id' => 'device-123',
        'payload' => '{"temperature":22}',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => [
                'id',
                'type',
                'status',
                'correlation_id',
                'payload',
            ],
        ]);

    expect($response->json('data.type'))->toBe('set_temperature')
        ->and($response->json('data.status'))->toBe(CommandStatus::PENDING->value)
        ->and($response->json('data.payload'))->toBe('{"temperature":22}');

    // Verify command was created
    $command = Command::find($response->json('data.id'));
    expect($command)->not->toBeNull()
        ->and($command->user_id)->toBe((string) $user->id)
        ->and($command->network_id)->toBe($network->id)
        ->and($command->status)->toBe(CommandStatus::PENDING);

    // Verify outbox event was created atomically
    $outboxEvent = OutboxEvent::where('aggregate_id', $command->id)->first();
    expect($outboxEvent)->not->toBeNull()
        ->and($outboxEvent->event_name)->toBe('command.created')
        ->and($outboxEvent->aggregate_type)->toBe('command');
});

test('command creation requires authentication', function () {
    $response = $this->postJson('/api/v1/commands', [
        'type' => 'set_temperature',
        'payload' => '{"temperature":22}',
    ]);

    $response->assertStatus(401);
});

test('command creation validates required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/v1/commands', [
        'type' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['type', 'network_id']);
});

test('command creation validates network exists', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/v1/commands', [
        'network_id' => 99999,
        'type' => 'set_temperature',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['network_id']);
});
