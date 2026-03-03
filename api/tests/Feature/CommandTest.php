<?php

use App\Enums\CommandStatus;
use App\Models\Command;
use App\Models\OutboxEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can create a command', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/v1/commands', [
        'type' => 'set_temperature',
        'device_id' => 'device-123',
        'payload' => ['temperature' => 22],
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
        ->and($response->json('data.status'))->toBe(CommandStatus::PENDING->value);

    // Verify command was created
    $command = Command::find($response->json('data.id'));
    expect($command)->not->toBeNull()
        ->and($command->user_id)->toBe((string) $user->id)
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
        'payload' => ['temperature' => 22],
    ]);

    $response->assertStatus(401);
});

test('command creation validates required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/v1/commands', [
        'type' => '',
        'payload' => 'not-an-array',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['type', 'payload']);
});
