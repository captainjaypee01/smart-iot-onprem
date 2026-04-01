<?php

use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\Network;
use App\Models\User;

test('authenticated user can create a command', function () {
    $user    = User::factory()->create(['is_superadmin' => true]);
    $network = Network::factory()->create();

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/commands', [
        'network_id'          => $network->id,
        'node_address'        => 'A3F2B1',
        'source_ep'           => 10,
        'dest_ep'             => 1,
        'payload'             => 'DEADBEEF',
        'include_tracking_id' => 'manual',
        'packet_id'           => 'AB12',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => ['id', 'type', 'node_address', 'processing_status', 'created_at'],
        ]);

    expect($response->json('data.type'))->toBe('send_data')
        ->and($response->json('data.processing_status'))->toBe(ProcessingStatus::Pending->value)
        ->and($response->json('data.node_address'))->toBe('A3F2B1');

    $command = Command::find($response->json('data.id'));
    expect($command)->not->toBeNull()
        ->and($command->network_id)->toBe($network->id);
});

test('command creation requires authentication', function () {
    $response = $this->postJson('/api/v1/commands', [
        'node_address' => 'A3F2B1',
    ]);

    $response->assertStatus(401);
});

test('command creation validates required fields', function () {
    $user = User::factory()->create(['is_superadmin' => true]);

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/commands', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['network_id', 'node_address', 'include_tracking_id']);
});

test('command creation validates network exists', function () {
    $user = User::factory()->create(['is_superadmin' => true]);

    $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/commands', [
        'network_id'          => 99999,
        'node_address'        => 'A3F2B1',
        'include_tracking_id' => 'none',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['network_id']);
});

describe('auto packet ID — sequential generation', function () {
    test('first command gets packet id 0001', function () {
        $user    = User::factory()->create(['is_superadmin' => true]);
        $network = Network::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/commands', [
            'network_id'          => $network->id,
            'node_address'        => 'A3F2B1',
            'include_tracking_id' => 'auto',
        ]);

        $response->assertStatus(201);
        expect($response->json('data.packet_id'))->toBe('0001');
    });

    test('subsequent commands increment the packet id', function () {
        $user    = User::factory()->create(['is_superadmin' => true]);
        $network = Network::factory()->create();

        // Seed an existing command with a known packet_id
        Command::factory()->create([
            'network_id' => $network->id,
            'packet_id'  => '0005',
            'no_packet_id' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/commands', [
            'network_id'          => $network->id,
            'node_address'        => 'A3F2B1',
            'include_tracking_id' => 'auto',
        ]);

        $response->assertStatus(201);
        expect($response->json('data.packet_id'))->toBe('0006');
    });

    test('packet id wraps from FFFE back to 0001', function () {
        $user    = User::factory()->create(['is_superadmin' => true]);
        $network = Network::factory()->create();

        Command::factory()->create([
            'network_id'   => $network->id,
            'packet_id'    => 'FFFE',
            'no_packet_id' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/commands', [
            'network_id'          => $network->id,
            'node_address'        => 'A3F2B1',
            'include_tracking_id' => 'auto',
        ]);

        $response->assertStatus(201);
        expect($response->json('data.packet_id'))->toBe('0001');
    });
});

describe('GET /api/v1/commands/{command}', function () {
    test('superadmin can view any command', function () {
        $user    = User::factory()->create(['is_superadmin' => true]);
        $network = Network::factory()->create();
        $command = Command::factory()->create([
            'network_id' => $network->id,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/commands/{$command->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $command->id)
            ->assertJsonPath('data.type', $command->type)
            ->assertJsonStructure([
                'data' => [
                    'id', 'type', 'node_address', 'processing_status',
                    'message_status', 'network', 'created_by', 'retry_count',
                ],
            ]);
    });

    test('returns 404 for non-existent command', function () {
        $user = User::factory()->create(['is_superadmin' => true]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/commands/999999999');

        $response->assertStatus(404);
    });

    test('unauthenticated request returns 401', function () {
        $response = $this->getJson('/api/v1/commands/1');

        $response->assertStatus(401);
    });
});
