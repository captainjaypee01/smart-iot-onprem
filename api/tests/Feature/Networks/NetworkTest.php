<?php

declare(strict_types=1);

// tests/Feature/Networks/NetworkTest.php

use App\Models\Network;
use App\Models\NodeType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createNetworkSuperadmin(): User
{
    return User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);
}

function createNetworkNonSuperadmin(): User
{
    return User::factory()->create([
        'is_superadmin' => false,
    ]);
}

describe('network index', function (): void {
    it('allows superadmin to list networks with pagination', function (): void {
        $superadmin = createNetworkSuperadmin();

        Network::factory()->count(3)->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/networks');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'network_address',
                        'description',
                        'remarks',
                        'is_active',
                        'diagnostic_interval',
                        'alarm_threshold',
                        'alarm_threshold_unit',
                        'wirepas_version',
                        'commissioned_date',
                        'is_maintenance',
                        'maintenance_start_at',
                        'maintenance_end_at',
                        'has_monthly_report',
                        'node_types',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'links',
                'meta',
            ]);
    });

    it('applies search filter on name and network_address', function (): void {
        $superadmin = createNetworkSuperadmin();

        Network::factory()->create([
            'name' => 'Building Alpha',
            'network_address' => 'AAA111',
        ]);

        Network::factory()->create([
            'name' => 'Other',
            'network_address' => 'BBB222',
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/networks?search=Alpha');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['name'])->toBe('Building Alpha');

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/networks?search=BBB222');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['network_address'])->toBe('0xBBB222');
    });

    it('filters by is_active flag', function (): void {
        $superadmin = createNetworkSuperadmin();

        Network::factory()->create(['is_active' => true]);
        Network::factory()->create(['is_active' => false]);

        $active = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/networks?is_active=1');

        $active->assertStatus(200);
        foreach ($active->json('data') as $row) {
            expect($row['is_active'])->toBeTrue();
        }

        $inactive = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/networks?is_active=0');

        $inactive->assertStatus(200);
        foreach ($inactive->json('data') as $row) {
            expect($row['is_active'])->toBeFalse();
        }
    });

    it('filters by is_maintenance flag', function (): void {
        $superadmin = createNetworkSuperadmin();

        Network::factory()->create(['is_maintenance' => true]);
        Network::factory()->create(['is_maintenance' => false]);

        $on = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/networks?is_maintenance=1');

        $on->assertStatus(200);
        foreach ($on->json('data') as $row) {
            expect($row['is_maintenance'])->toBeTrue();
        }

        $off = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/networks?is_maintenance=0');

        $off->assertStatus(200);
        foreach ($off->json('data') as $row) {
            expect($row['is_maintenance'])->toBeFalse();
        }
    });

    it('forbids non-superadmin from listing networks', function (): void {
        $user = createNetworkNonSuperadmin();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/networks');

        $response->assertStatus(403);
    });
});

describe('network show', function (): void {
    it('returns correct shape including node_types as objects', function (): void {
        $superadmin = createNetworkSuperadmin();

        $network = Network::factory()->create();
        $nodeType = NodeType::factory()->create();
        $network->nodeTypes()->attach($nodeType->id);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/networks/{$network->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'name',
                'network_address',
                'description',
                'remarks',
                'is_active',
                'diagnostic_interval',
                'alarm_threshold',
                'alarm_threshold_unit',
                'wirepas_version',
                'commissioned_date',
                'is_maintenance',
                'maintenance_start_at',
                'maintenance_end_at',
                'has_monthly_report',
                'node_types' => [
                    '*' => ['id', 'name', 'area_id'],
                ],
                'created_at',
                'updated_at',
            ]);

        $data = $response->json();
        expect($data['node_types'][0]['id'])->toBe($nodeType->id);
    });

    it('forbids non-superadmin from viewing a network', function (): void {
        $user = createNetworkNonSuperadmin();
        $network = Network::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/networks/{$network->id}");

        $response->assertStatus(403);
    });
});

describe('network store', function (): void {
    it('creates a network with all fields', function (): void {
        $superadmin = createNetworkSuperadmin();
        $nodeType = NodeType::factory()->create();

        $payload = [
            'name' => 'Building A — Floor 3',
            'network_address' => 'a3f2b1',
            'description' => 'Desc',
            'remarks' => 'Remarks',
            'is_active' => true,
            'diagnostic_interval' => 10,
            'alarm_threshold' => 5,
            'alarm_threshold_unit' => 'minutes',
            'wirepas_version' => '5.2',
            'commissioned_date' => '2026-03-20',
            'is_maintenance' => true,
            'maintenance_start_at' => '2026-04-01T08:00:00+00:00',
            'maintenance_end_at' => '2026-04-01T18:00:00+00:00',
            'has_monthly_report' => true,
            'node_types' => [$nodeType->id],
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(201);
        $data = $response->json();

        expect($data['name'])->toBe('Building A — Floor 3');
        expect($data['network_address'])->toBe('A3F2B1');
        expect($data['diagnostic_interval'])->toBe(10);
        expect($data['alarm_threshold'])->toBe(5);
        expect($data['alarm_threshold_unit'])->toBe('minutes');
        expect($data['wirepas_version'])->toBe('5.2');
        expect($data['commissioned_date'])->toBe('2026-03-20');
        expect($data['is_maintenance'])->toBeTrue();
        expect($data['has_monthly_report'])->toBeTrue();
        expect($data['node_types'])->toHaveCount(1);
        expect($data['node_types'][0]['id'])->toBe($nodeType->id);
    });

    it('creates a network with minimal required fields', function (): void {
        $superadmin = createNetworkSuperadmin();

        $payload = [
            'name' => 'Minimal',
            'network_address' => 'ABCDEF',
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(201);
        $data = $response->json();

        expect($data['name'])->toBe('Minimal');
        expect($data['network_address'])->toBe('ABCDEF');
    });

    it('syncs node_types pivot correctly', function (): void {
        $superadmin = createNetworkSuperadmin();
        $nodeType1 = NodeType::factory()->create();
        $nodeType2 = NodeType::factory()->create();

        $payload = [
            'name' => 'Pivot Test',
            'network_address' => 'AAA111',
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
            'node_types' => [$nodeType1->id, $nodeType2->id],
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(201);

        $network = Network::firstWhere('name', 'Pivot Test');
        expect($network)->not->toBeNull();
        expect($network->nodeTypes()->pluck('id')->all())->toEqualCanonicalizing([
            $nodeType1->id,
            $nodeType2->id,
        ]);
    });

    it('stores network_address uppercase regardless of input case', function (): void {
        $superadmin = createNetworkSuperadmin();

        $payload = [
            'name' => 'Case Network',
            'network_address' => 'a1b2c3',
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('network_address', 'A1B2C3');

        $network = Network::firstWhere('name', 'Case Network');
        expect($network?->network_address)->toBe('A1B2C3');
    });

    it('rejects invalid network_address regex', function (): void {
        $superadmin = createNetworkSuperadmin();

        $payload = [
            'name' => 'Bad Address',
            'network_address' => 'ABC1234', // too long
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(422);
    });

    it('rejects invalid diagnostic_interval', function (): void {
        $superadmin = createNetworkSuperadmin();

        $payload = [
            'name' => 'Bad Interval',
            'network_address' => 'AAA111',
            'diagnostic_interval' => 99,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(422);
    });

    it('rejects invalid alarm_threshold_unit', function (): void {
        $superadmin = createNetworkSuperadmin();

        $payload = [
            'name' => 'Bad Unit',
            'network_address' => 'AAA111',
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'days',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(422);
    });

    it('rejects invalid wirepas_version', function (): void {
        $superadmin = createNetworkSuperadmin();

        $payload = [
            'name' => 'Bad Version',
            'network_address' => 'AAA111',
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
            'wirepas_version' => '3.0',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(422);
    });

    it('rejects maintenance_end_at before maintenance_start_at', function (): void {
        $superadmin = createNetworkSuperadmin();

        $payload = [
            'name' => 'Bad Maintenance',
            'network_address' => '0xAAA111',
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
            'is_maintenance' => true,
            'maintenance_start_at' => '2026-04-01T10:00:00+00:00',
            'maintenance_end_at' => '2026-04-01T09:00:00+00:00',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(422);
    });

    it('requires maintenance datetimes when is_maintenance is true', function (): void {
        $superadmin = createNetworkSuperadmin();

        $payload = [
            'name' => 'Missing Datetimes',
            'network_address' => '0xAAA111',
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
            'is_maintenance' => true,
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(422);
    });

    it('forbids non-superadmin from creating a network', function (): void {
        $user = createNetworkNonSuperadmin();

        $payload = [
            'name' => 'Forbidden',
            'network_address' => '0xAAA111',
            'diagnostic_interval' => 5,
            'alarm_threshold' => 1,
            'alarm_threshold_unit' => 'minutes',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/networks', $payload);

        $response->assertStatus(403);
    });
});

describe('network update', function (): void {
    it('updates fields correctly', function (): void {
        $superadmin = createNetworkSuperadmin();

        $network = Network::factory()->create([
            'name' => 'Original',
            'network_address' => 'AAA111',
        ]);

        $payload = [
            'name' => 'Updated',
            'network_address' => 'bbb222',
            'diagnostic_interval' => 10,
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/networks/{$network->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('name', 'Updated')
            ->assertJsonPath('network_address', 'BBB222')
            ->assertJsonPath('diagnostic_interval', 10);
    });

    it('omitting node_types leaves pivot unchanged', function (): void {
        $superadmin = createNetworkSuperadmin();
        $nodeType = NodeType::factory()->create();
        $network = Network::factory()->create();
        $network->nodeTypes()->attach($nodeType->id);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/networks/{$network->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertStatus(200);

        $network->refresh();
        expect($network->nodeTypes()->pluck('id')->all())->toEqual([$nodeType->id]);
    });

    it('sending empty node_types array clears pivot', function (): void {
        $superadmin = createNetworkSuperadmin();
        $nodeType = NodeType::factory()->create();
        $network = Network::factory()->create();
        $network->nodeTypes()->attach($nodeType->id);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/networks/{$network->id}", [
                'node_types' => [],
            ]);

        $response->assertStatus(200);

        $network->refresh();
        expect($network->nodeTypes()->count())->toBe(0);
    });

    it('validates maintenance window coherence on update', function (): void {
        $superadmin = createNetworkSuperadmin();
        $network = Network::factory()->create();

        $payload = [
            'is_maintenance' => true,
            'maintenance_start_at' => '2026-04-01T10:00:00+00:00',
            'maintenance_end_at' => '2026-04-01T09:00:00+00:00',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/networks/{$network->id}", $payload);

        $response->assertStatus(422);
    });

    it('forbids non-superadmin from updating a network', function (): void {
        $user = createNetworkNonSuperadmin();
        $network = Network::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/networks/{$network->id}", [
                'name' => 'Forbidden',
            ]);

        $response->assertStatus(403);
    });
});

describe('network destroy', function (): void {
    it('allows superadmin to delete a network', function (): void {
        $superadmin = createNetworkSuperadmin();
        $network = Network::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->deleteJson("/api/v1/networks/{$network->id}");

        $response->assertStatus(204);
        expect(Network::find($network->id))->toBeNull();
    });

    it('forbids non-superadmin from deleting a network', function (): void {
        $user = createNetworkNonSuperadmin();
        $network = Network::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/networks/{$network->id}");

        $response->assertStatus(403);
    });
});

describe('generate address', function (): void {
    it('returns a generated network address matching regex', function (): void {
        $superadmin = createNetworkSuperadmin();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/networks/generate-address');

        $response->assertStatus(200);
        $address = $response->json('data.network_address');
        expect($address)->toBeString();
        expect($address)->toMatch('/^[0-9A-F]{6}$/');
    });

    it('forbids non-superadmin from generating an address', function (): void {
        $user = createNetworkNonSuperadmin();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/networks/generate-address');

        $response->assertStatus(403);
    });
});

describe('toggle maintenance', function (): void {
    it('turning on sets is_maintenance and both datetimes', function (): void {
        $superadmin = createNetworkSuperadmin();
        $network = Network::factory()->create([
            'is_maintenance' => false,
            'maintenance_start_at' => null,
            'maintenance_end_at' => null,
        ]);

        $payload = [
            'is_maintenance' => true,
            'maintenance_start_at' => '2026-04-01T08:00:00+00:00',
            'maintenance_end_at' => '2026-04-01T18:00:00+00:00',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/networks/{$network->id}/toggle-maintenance", $payload);

        $response->assertStatus(200);
        $data = $response->json();
        expect($data['is_maintenance'])->toBeTrue();
        expect($data['maintenance_start_at'])->not->toBeNull();
        expect($data['maintenance_end_at'])->not->toBeNull();
    });

    it('turning off clears maintenance window and flag', function (): void {
        $superadmin = createNetworkSuperadmin();
        $network = Network::factory()->create([
            'is_maintenance' => true,
            'maintenance_start_at' => '2026-04-01 08:00:00',
            'maintenance_end_at' => '2026-04-01 18:00:00',
        ]);

        $payload = [
            'is_maintenance' => false,
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/networks/{$network->id}/toggle-maintenance", $payload);

        $response->assertStatus(200);
        $data = $response->json();
        expect($data['is_maintenance'])->toBeFalse();
        expect($data['maintenance_start_at'])->toBeNull();
        expect($data['maintenance_end_at'])->toBeNull();
    });

    it('requires datetimes when turning maintenance on', function (): void {
        $superadmin = createNetworkSuperadmin();
        $network = Network::factory()->create();

        $payload = [
            'is_maintenance' => true,
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/networks/{$network->id}/toggle-maintenance", $payload);

        $response->assertStatus(422);
    });

    it('forbids non-superadmin from toggling maintenance', function (): void {
        $user = createNetworkNonSuperadmin();
        $network = Network::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/networks/{$network->id}/toggle-maintenance", [
                'is_maintenance' => true,
                'maintenance_start_at' => '2026-04-01T08:00:00+00:00',
                'maintenance_end_at' => '2026-04-01T18:00:00+00:00',
            ]);

        $response->assertStatus(403);
    });
});

