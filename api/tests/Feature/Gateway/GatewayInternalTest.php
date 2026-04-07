<?php

declare(strict_types=1);

use App\Models\Gateway;
use App\Models\Network;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config(['app.internal_api_token' => 'test-internal-token']);
});

// ── PATCH /internal/gateways/{id}/last-seen ───────────────────────────────────

describe('PATCH /internal/gateways/{id}/last-seen', function (): void {

    it('updates last_seen_at with a valid internal token', function (): void {
        $network = Network::factory()->create(['gateway_prefix' => 'INT001']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'INT001_01',
            'sink_id' => '01',
            'last_seen_at' => null,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/gateways/{$gateway->id}/last-seen");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'gateway_id', 'last_seen_at'],
            ])
            ->assertJsonPath('data.id', $gateway->id)
            ->assertJsonPath('data.gateway_id', 'INT001_01');

        $gateway->refresh();
        expect($gateway->last_seen_at)->not->toBeNull();
    });

    it('requires a valid internal token — missing token returns 401', function (): void {
        $network = Network::factory()->create(['gateway_prefix' => 'INT002']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'INT002_01',
            'sink_id' => '01',
        ]);

        $this->patchJson("/internal/gateways/{$gateway->id}/last-seen")
            ->assertStatus(401);
    });

    it('rejects a wrong internal token', function (): void {
        $network = Network::factory()->create(['gateway_prefix' => 'INT003']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'INT003_01',
            'sink_id' => '01',
        ]);

        $this->withHeader('X-Internal-Token', 'wrong-token')
            ->patchJson("/internal/gateways/{$gateway->id}/last-seen")
            ->assertStatus(401);
    });

    it('works for soft-deleted gateways', function (): void {
        $network = Network::factory()->create(['gateway_prefix' => 'INT004']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'INT004_01',
            'sink_id' => '01',
            'last_seen_at' => null,
        ]);
        $gateway->delete();

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/gateways/{$gateway->id}/last-seen");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $gateway->id);

        // Reload with trashed to confirm last_seen_at was written
        $refreshed = Gateway::withTrashed()->find($gateway->id);
        expect($refreshed->last_seen_at)->not->toBeNull();
    });

    it('returns 404 for a non-existent gateway', function (): void {
        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson('/internal/gateways/999999/last-seen')
            ->assertStatus(404);
    });

    it('response contains updated last_seen_at timestamp', function (): void {
        $network = Network::factory()->create(['gateway_prefix' => 'INT005']);

        $gateway = Gateway::factory()->create([
            'network_id' => $network->id,
            'gateway_id' => 'INT005_01',
            'sink_id' => '01',
            'last_seen_at' => null,
        ]);

        $response = $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson("/internal/gateways/{$gateway->id}/last-seen");

        $response->assertStatus(200);

        $lastSeenAt = $response->json('data.last_seen_at');
        expect($lastSeenAt)->not->toBeNull()
            ->and($lastSeenAt)->toBeString();
    });

});
