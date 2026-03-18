<?php

declare(strict_types=1);

// tests/Feature/Permissions/PermissionApiTest.php
// Feature tests for the permissions API (grouped index, options, CRUD).

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Testing\TestResponse;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

beforeEach(function (): void {
    $this->seed(PermissionSeeder::class);

    /** @var \App\Models\User $admin */
    $admin = User::factory()->create([
        'is_superadmin' => false,
    ]);

    /** @var \App\Models\Role $role */
    $role = Role::factory()->create();

    $admin->role()->associate($role)->save();

    /** @var \Illuminate\Support\Collection<string,int> $permissionIds */
    $permissionIds = Permission::query()->pluck('id', 'key');

    // Give this role the permission.view / create / update / delete permissions if they exist.
    $keys = collect([
        'permission.view',
        'permission.create',
        'permission.update',
        'permission.delete',
    ])->filter(static fn (string $key) => $permissionIds->has($key));

    $role->permissions()->sync(
        $keys
            ->map(static fn (string $key): int => (int) $permissionIds->get($key))
            ->all(),
    );

    test()->admin = $admin;
});

test('permissions grouped index returns groups for authorised user', function (): void {
    /** @var User $admin */
    $admin = test()->admin;

    $response = actingAs($admin, 'sanctum')->getJson('/api/v1/permissions');

    $response
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                [
                    'module',
                    'label',
                    'permissions' => [
                        [
                            'id',
                            'key',
                            'display_name',
                            'module',
                            'description',
                            'created_at',
                        ],
                    ],
                ],
            ],
        ]);
});

test('permissions options returns flat list', function (): void {
    /** @var User $admin */
    $admin = test()->admin;

    $response = actingAs($admin, 'sanctum')->getJson('/api/v1/permissions/options');

    $response
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'key',
                    'display_name',
                    'module',
                ],
            ],
        ]);
});

test('create permission validates and persists record', function (): void {
    /** @var User $admin */
    $admin = test()->admin;

    $payload = [
        'key' => 'demo.create',
        'display_name' => 'Create Demo',
        'module' => 'demo',
        'description' => 'Demo permission',
    ];

    $response = actingAs($admin, 'sanctum')->postJson('/api/v1/permissions', $payload);

    $response->assertCreated()->assertJsonPath('data.key', 'demo.create');

    expect(Permission::where('key', 'demo.create')->exists())->toBeTrue();
});

test('update permission cannot change key or module', function (): void {
    /** @var User $admin */
    $admin = test()->admin;

    $permission = Permission::factory()->create([
        'key' => 'sample.view',
        'module' => 'sample',
    ]);

    $response = actingAs($admin, 'sanctum')->putJson(
        "/api/v1/permissions/{$permission->id}",
        [
            'key' => 'other.view',
            'module' => 'other',
            'display_name' => 'Updated name',
        ],
    );

    $response->assertStatus(422);
});

test('delete permission returns conflict when in use', function (): void {
    /** @var User $admin */
    $admin = test()->admin;

    /** @var Permission $permission */
    $permission = Permission::factory()->create([
        'key' => 'inuse.view',
        'module' => 'inuse',
    ]);

    /** @var Role $role */
    $role = Role::factory()->create();
    $role->permissions()->attach($permission->id);

    $response = actingAs($admin, 'sanctum')->deleteJson("/api/v1/permissions/{$permission->id}");

    $response->assertStatus(409);
});

