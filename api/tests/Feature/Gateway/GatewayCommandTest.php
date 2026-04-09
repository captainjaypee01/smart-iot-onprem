<?php

declare(strict_types=1);

use App\Enums\MessageStatus;
use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\Gateway;
use App\Models\Network;
use App\Models\OutboxEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── POST /api/v1/gateways/{id}/commands ──────────────────────────────────────

describe('POST /api/v1/gateways/{id}/commands', function (): void {

    it('superadmin can send get_configs command', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD001']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD001_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'get_configs',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id', 'type', 'node_address', 'processing_status',
                ],
            ])
            ->assertJsonPath('data.type', 'get_configs');
    });

    it('superadmin can send diagnostic command', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD002']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD002_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'diagnostic',
                'diagnostic_type' => 'check_utilization',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'diagnostic');
    });

    it('get_configs command is created with no_packet_id=true', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD003']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD003_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'get_configs',
            ]);

        $response->assertStatus(201);

        $command = Command::find($response->json('data.id'));
        expect($command)->not->toBeNull()
            ->and($command->no_packet_id)->toBeTrue();
    });

    it('invalid command type returns 422', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD004']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD004_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'not_a_real_command_type',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    });

    it('invalid diagnostic_type returns 422', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD005']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD005_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'diagnostic',
                'diagnostic_type' => 'not_a_real_diagnostic_type',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['diagnostic_type']);
    });

    it('command creates an outbox event with correct event name', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD006']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD006_01',
            'sink_id' => '01',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'get_configs',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('outbox_events', [
            'event_name' => 'command.gateway.created',
        ]);

        $outbox = OutboxEvent::where('event_name', 'command.gateway.created')->first();
        expect($outbox)->not->toBeNull()
            ->and($outbox->payload)->toHaveKey('command_id');
    });

    it('command sets node_address to gateway_id', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD007']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD007_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'get_configs',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.node_address', 'CMD007_01');

        $command = Command::find($response->json('data.id'));
        expect($command->node_address)->toBe('CMD007_01');
    });

    it('command sets correct message_status of 7', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD008']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD008_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'get_configs',
            ]);

        $response->assertStatus(201);

        $command = Command::find($response->json('data.id'));
        expect($command->message_status)->toBe(MessageStatus::GatewayResponded);
    });

    it('command sets network_id from gateway', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD009']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD009_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'get_configs',
            ]);

        $response->assertStatus(201);

        $command = Command::find($response->json('data.id'));
        expect($command->network_id)->toBe($network->id);
    });

    it('non-superadmin cannot send a gateway command', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD010']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD010_01',
            'sink_id' => '01',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'get_configs',
            ])
            ->assertStatus(403);
    });

    it('sending command to soft-deleted gateway returns 404', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD011']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD011_01',
            'sink_id' => '01',
        ]);
        $gateway->delete();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'get_configs',
            ])
            ->assertStatus(404);
    });

    it('command sets processing_status to pending', function (): void {
        $user = User::factory()->create(['is_superadmin' => true, 'company_id' => null, 'role_id' => null]);
        $network = Network::factory()->create(['gateway_prefix' => 'CMD012']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'CMD012_01',
            'sink_id' => '01',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/gateways/{$gateway->id}/commands", [
                'type' => 'diagnostic',
                'diagnostic_type' => 'check_utilization',
            ]);

        $response->assertStatus(201);

        $command = Command::find($response->json('data.id'));
        expect($command->processing_status)->toBe(ProcessingStatus::Pending);
    });

});
