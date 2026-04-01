<?php

declare(strict_types=1);

// tests/Feature/NodeTypes/NodeTypeTest.php

use App\Models\Network;
use App\Models\NodeType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createNonSuperadmin(): User
{
    return User::factory()->create([
        'is_superadmin' => false,
    ]);
}

describe('node type index and show', function (): void {
    it('allows superadmin to list node types (paginated)', function (): void {
        $superadmin = createSuperadmin();

        NodeType::factory()->count(3)->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/node-types');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'area_id', 'description', 'sensors', 'sensor_count', 'created_at', 'updated_at'],
                ],
                'links',
                'meta',
            ]);
    });

    it('allows superadmin to view a single node type', function (): void {
        $superadmin = createSuperadmin();

        $nodeType = NodeType::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/node-types/{$nodeType->id}");

        $response->assertStatus(200)
            ->assertJsonPath('id', $nodeType->id);
    });
});

describe('node type store', function (): void {
    it('allows superadmin to create a node type with no sensors', function (): void {
        $superadmin = createSuperadmin();

        $payload = [
            'name' => 'No Sensors',
            'area_id' => 'abc123',
            'description' => null,
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/node-types', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'No Sensors')
            ->assertJsonPath('area_id', 'ABC123')
            ->assertJsonPath('sensor_count', 0)
            ->assertJsonPath('sensors', []);
    });

    it('allows superadmin to create a node type with 1 sensor mapping to slot 1 only', function (): void {
        $superadmin = createSuperadmin();

        $payload = [
            'name' => 'Single Sensor',
            'area_id' => 'a1b2c3',
            'description' => null,
            'sensors' => [
                ['name' => 'Pressure', 'unit' => 'bar'],
            ],
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/node-types', $payload);

        $response->assertStatus(201);

        $data = $response->json();
        expect($data['sensor_count'])->toBe(1);
        expect($data['sensors'])->toHaveCount(1);
        expect($data['sensors'][0]['slot'])->toBe(1);
        expect($data['sensors'][0]['name'])->toBe('Pressure');
        expect($data['sensors'][0]['unit'])->toBe('bar');
    });

    it('allows superadmin to create a node type with 8 sensors filling all flat columns', function (): void {
        $superadmin = createSuperadmin();

        $sensors = [];
        for ($i = 1; $i <= 8; $i++) {
            $sensors[] = ['name' => "Sensor {$i}", 'unit' => "U{$i}"];
        }

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/node-types', [
                'name' => 'Eight Sensors',
                'area_id' => 'ffee',
                'description' => null,
                'sensors' => $sensors,
            ]);

        $response->assertStatus(201);

        $data = $response->json();
        expect($data['sensor_count'])->toBe(8);
        expect($data['sensors'])->toHaveCount(8);

        // sensors sorted by slot
        foreach ($data['sensors'] as $index => $sensor) {
            expect($sensor['slot'])->toBe($index + 1);
        }
    });

    it('does not expose raw flat sensor columns in response', function (): void {
        $superadmin = createSuperadmin();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/node-types', [
                'name' => 'Hidden Flats',
                'area_id' => 'abc',
                'description' => null,
                'sensors' => [
                    ['name' => 'Pressure', 'unit' => 'bar'],
                ],
            ]);

        $response->assertStatus(201);

        $data = $response->json();
        foreach (range(1, 8) as $slot) {
            expect($data)->not->toHaveKey("sensor_{$slot}_name");
            expect($data)->not->toHaveKey("sensor_{$slot}_unit");
        }
    });

    it('normalises area_id to uppercase in the response', function (): void {
        $superadmin = createSuperadmin();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/node-types', [
                'name' => 'Case Test',
                'area_id' => 'a1b2c3',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('area_id', 'A1B2C3');
    });

    it('rejects non-contiguous sensors (missing slot 1 with slot 2 present)', function (): void {
        $superadmin = createSuperadmin();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/node-types', [
                'name' => 'Bad Sensors',
                'area_id' => 'bad01',
                'sensors' => [
                    ['name' => '', 'unit' => null],
                    ['name' => 'Second', 'unit' => null],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'The given data was invalid.']);
    });

    it('rejects duplicate name', function (): void {
        $superadmin = createSuperadmin();

        NodeType::factory()->create(['name' => 'Duplicate Name']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/node-types', [
                'name' => 'Duplicate Name',
                'area_id' => 'd1',
            ]);

        $response->assertStatus(422);
    });

    it('rejects duplicate area_id', function (): void {
        $superadmin = createSuperadmin();

        NodeType::factory()->create(['area_id' => 'ABC123']);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/node-types', [
                'name' => 'Another',
                'area_id' => 'abc123',
            ]);

        $response->assertStatus(422);
    });
});

describe('node type update', function (): void {
    it('cascade-clears slots 3-8 when updating with 2 sensors', function (): void {
        $superadmin = createSuperadmin();

        $nodeType = NodeType::factory()->create([
            'sensor_1_name' => 'S1',
            'sensor_1_unit' => 'U1',
            'sensor_2_name' => 'S2',
            'sensor_2_unit' => 'U2',
            'sensor_3_name' => 'S3',
            'sensor_3_unit' => 'U3',
            'sensor_4_name' => 'S4',
            'sensor_4_unit' => 'U4',
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/node-types/{$nodeType->id}", [
                'sensors' => [
                    ['name' => 'New S1', 'unit' => 'NS1'],
                    ['name' => 'New S2', 'unit' => 'NS2'],
                ],
            ]);

        $response->assertStatus(200);

        $nodeType->refresh();

        expect($nodeType->sensor_1_name)->toBe('New S1');
        expect($nodeType->sensor_2_name)->toBe('New S2');

        foreach (range(3, 8) as $slot) {
            expect($nodeType->{"sensor_{$slot}_name"})->toBeNull();
            expect($nodeType->{"sensor_{$slot}_unit"})->toBeNull();
        }
    });

    it('omitting sensors on update leaves existing slots unchanged', function (): void {
        $superadmin = createSuperadmin();

        $nodeType = NodeType::factory()->create([
            'sensor_1_name' => 'S1',
            'sensor_1_unit' => 'U1',
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/node-types/{$nodeType->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertStatus(200);

        $nodeType->refresh();
        expect($nodeType->name)->toBe('Updated Name');
        expect($nodeType->sensor_1_name)->toBe('S1');
        expect($nodeType->sensor_1_unit)->toBe('U1');
    });

    it('sensors array in response is ordered by slot number', function (): void {
        $superadmin = createSuperadmin();

        $nodeType = NodeType::factory()->create([
            'sensor_1_name' => 'A',
            'sensor_1_unit' => null,
            'sensor_2_name' => 'B',
            'sensor_2_unit' => null,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/node-types/{$nodeType->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'sensors')
            ->assertJsonPath('sensors.0.slot', 1)
            ->assertJsonPath('sensors.1.slot', 2);
    });

    it('rejects non-contiguous sensors on update', function (): void {
        $superadmin = createSuperadmin();

        $nodeType = NodeType::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/node-types/{$nodeType->id}", [
                'sensors' => [
                    ['name' => 'First', 'unit' => null],
                    ['name' => '', 'unit' => null],
                    ['name' => 'Third', 'unit' => null],
                ],
            ]);

        $response->assertStatus(422);
    });
});

describe('node type destroy', function (): void {
    it('deletes a node type that is not in use and returns 204', function (): void {
        $superadmin = createSuperadmin();

        $nodeType = NodeType::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->deleteJson("/api/v1/node-types/{$nodeType->id}");

        $response->assertStatus(204);
        expect(NodeType::find($nodeType->id))->toBeNull();
    });

    it('returns 409 when deleting node type in use by a network', function (): void {
        $superadmin = createSuperadmin();

        $nodeType = NodeType::factory()->create();
        $network = Network::factory()->create();
        $network->nodeTypes()->attach($nodeType->id);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->deleteJson("/api/v1/node-types/{$nodeType->id}");

        $response->assertStatus(409)
            ->assertJsonFragment(['message' => 'Node type is in use by one or more networks.']);
    });
});

describe('node type options', function (): void {
    it('allows non-superadmin to access /options', function (): void {
        $user = createNonSuperadmin();

        NodeType::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/node-types/options');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'name', 'area_id']]]);
    });

    it('rejects unauthenticated access to /options with 401', function (): void {
        $response = $this->getJson('/api/v1/node-types/options');

        $response->assertStatus(401);
    });
});

describe('node type authorization', function (): void {
    it('forbids non-superadmin from accessing index', function (): void {
        $user = createNonSuperadmin();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/node-types');

        $response->assertStatus(403);
    });

    it('forbids non-superadmin from accessing show', function (): void {
        $user = createNonSuperadmin();
        $nodeType = NodeType::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/node-types/{$nodeType->id}");

        $response->assertStatus(403);
    });

    it('forbids non-superadmin from creating', function (): void {
        $user = createNonSuperadmin();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/node-types', [
                'name' => 'Forbidden',
                'area_id' => 'ff',
            ]);

        $response->assertStatus(403);
    });

    it('forbids non-superadmin from updating', function (): void {
        $user = createNonSuperadmin();
        $nodeType = NodeType::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/node-types/{$nodeType->id}", [
                'name' => 'Forbidden',
            ]);

        $response->assertStatus(403);
    });

    it('forbids non-superadmin from deleting', function (): void {
        $user = createNonSuperadmin();
        $nodeType = NodeType::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/node-types/{$nodeType->id}");

        $response->assertStatus(403);
    });
}
);

