<?php

declare(strict_types=1);

use App\Models\Feature;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\putJson;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Artisan::call('db:seed', [
        '--class' => FeatureSeeder::class,
    ]);
});

function createFeatureSuperadmin(): User
{
    return User::factory()->create([
        'is_superadmin' => true,
        'company_id' => null,
        'role_id' => null,
    ]);
}

function createFeatureNonSuperadmin(): User
{
    return User::factory()->create([
        'is_superadmin' => false,
        'company_id' => null,
        'role_id' => null,
    ]);
}

test('unauthenticated requests to GET /features/options return 401', function (): void {
    $response = getJson('/api/v1/features/options');

    $response->assertStatus(401);
});

test('non-superadmin cannot list all features (GET /features)', function (): void {
    $user = createFeatureNonSuperadmin();

    $response = actingAs($user, 'sanctum')
        ->getJson('/api/v1/features');

    $response->assertStatus(403);
});

test('GET /features/options excludes admin group', function (): void {
    $user = createFeatureNonSuperadmin();

    $response = actingAs($user, 'sanctum')
        ->getJson('/api/v1/features/options');

    $response->assertStatus(200);
    $data = $response->json('data');

    $groups = collect($data)->pluck('group')->all();
    expect($groups)->not->toContain('admin');
});

test('reorder-groups rejects admin group (422)', function (): void {
    $superadmin = createFeatureSuperadmin();

    $response = actingAs($superadmin, 'sanctum')
        ->putJson('/api/v1/features/reorder-groups', [
            'groups' => [
                ['group' => 'admin', 'group_order' => 1],
            ],
        ]);

    $response->assertStatus(422);
});

test('reorder updates sort order within a group', function (): void {
    $superadmin = createFeatureSuperadmin();

    $dashboard = Feature::query()->where('key', 'dashboard')->firstOrFail();
    $fireExtinguisher = Feature::query()->where('key', 'fire-extinguisher')->firstOrFail();

    $response = actingAs($superadmin, 'sanctum')
        ->putJson('/api/v1/features/reorder', [
            'features' => [
                ['id' => $dashboard->id, 'sort_order' => 2],
                ['id' => $fireExtinguisher->id, 'sort_order' => 1],
            ],
        ]);

    $response->assertStatus(200);

    $data = $response->json('data');
    $monitoring = collect($data)->firstWhere('group', 'monitoring');

    expect($monitoring['features'][0]['key'])->toBe('fire-extinguisher');
    expect($monitoring['features'][1]['key'])->toBe('dashboard');
});

test('unauthenticated requests to POST /features return 401', function (): void {
    $response = postJson('/api/v1/features', [
        'key' => 'test-feature-create',
        'name' => 'Test Feature Create',
        'group' => 'monitoring',
        'group_order' => 1,
        'route' => '/test-feature-create',
        'icon' => 'LayoutDashboard',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $response->assertStatus(401);
});

test('non-superadmin cannot create a feature (POST /features)', function (): void {
    $user = createFeatureNonSuperadmin();

    $response = actingAs($user, 'sanctum')
        ->postJson('/api/v1/features', [
            'key' => 'test-feature-create',
            'name' => 'Test Feature Create',
            'group' => 'monitoring',
            'group_order' => 1,
            'route' => '/test-feature-create',
            'icon' => 'LayoutDashboard',
            'sort_order' => 1,
            'is_active' => true,
        ]);

    $response->assertStatus(403);
});

test('superadmin can create a feature (POST /features)', function (): void {
    $superadmin = createFeatureSuperadmin();

    $response = actingAs($superadmin, 'sanctum')
        ->postJson('/api/v1/features', [
            'key' => 'test-feature-create',
            'name' => 'Test Feature Create',
            'group' => 'monitoring',
            'group_order' => 1,
            'route' => '/test-feature-create',
            'icon' => 'LayoutDashboard',
            'sort_order' => 1,
            'is_active' => true,
        ]);

    $response->assertStatus(201);
    expect($response->json('key'))->toBe('test-feature-create');
    expect($response->json('route'))->toBe('/test-feature-create');

    $feature = Feature::query()->where('key', 'test-feature-create')->first();
    expect($feature)->not->toBeNull();
});

test('superadmin can create a feature in a custom group (POST /features)', function (): void {
    $superadmin = createFeatureSuperadmin();

    $response = actingAs($superadmin, 'sanctum')
        ->postJson('/api/v1/features', [
            'key' => 'test-feature-custom-group',
            'name' => 'Test Feature Custom Group',
            'group' => 'custom-group',
            'group_order' => 42,
            'route' => '/test-feature-custom-group',
            'icon' => 'LayoutDashboard',
            'sort_order' => 1,
            'is_active' => true,
        ]);

    $response->assertStatus(201);
    expect($response->json('group'))->toBe('custom-group');
});

test('superadmin cannot create duplicate feature key (422)', function (): void {
    $superadmin = createFeatureSuperadmin();

    // Create first.
    actingAs($superadmin, 'sanctum')
        ->postJson('/api/v1/features', [
            'key' => 'test-feature-duplicate-key',
            'name' => 'Test Feature Duplicate Key',
            'group' => 'monitoring',
            'group_order' => 1,
            'route' => '/test-feature-duplicate-key',
            'icon' => 'LayoutDashboard',
            'sort_order' => 1,
            'is_active' => true,
        ])->assertStatus(201);

    // Create second with same key.
    $response = actingAs($superadmin, 'sanctum')
        ->postJson('/api/v1/features', [
            'key' => 'test-feature-duplicate-key',
            'name' => 'Test Feature Duplicate Key 2',
            'group' => 'monitoring',
            'group_order' => 1,
            'route' => '/test-feature-duplicate-key-2',
            'icon' => 'LayoutDashboard',
            'sort_order' => 2,
            'is_active' => true,
        ]);

    $response->assertStatus(422);
});

test('non-superadmin cannot delete a feature (DELETE /features/{feature})', function (): void {
    $user = createFeatureNonSuperadmin();
    $superadmin = createFeatureSuperadmin();

    $feature = Feature::query()->where('key', 'dashboard')->firstOrFail();

    $response = actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/features/{$feature->id}");

    $response->assertStatus(403);
});

test('superadmin can delete a feature (DELETE /features/{feature})', function (): void {
    $superadmin = createFeatureSuperadmin();

    $create = actingAs($superadmin, 'sanctum')
        ->postJson('/api/v1/features', [
            'key' => 'test-feature-delete',
            'name' => 'Test Feature Delete',
            'group' => 'monitoring',
            'group_order' => 1,
            'route' => '/test-feature-delete',
            'icon' => 'LayoutDashboard',
            'sort_order' => 1,
            'is_active' => true,
        ]);

    $create->assertStatus(201);

    $featureId = (int) $create->json('id');

    $response = actingAs($superadmin, 'sanctum')
        ->deleteJson("/api/v1/features/{$featureId}");

    $response->assertStatus(204);

    $deleted = Feature::query()->where('id', $featureId)->exists();
    expect($deleted)->toBeFalse();
});

