<?php

declare(strict_types=1);

// tests/Feature/Roles/RoleTest.php

use App\Models\Company;
use App\Models\Feature;
use App\Models\Network;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\CompanySeeder;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

function createRoleSuperadmin(): User
{
    return User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);
}

function createRoleCompanyAdmin(Company $company): User
{
    $adminRole = Role::where('name', 'Admin')->first();

    return User::factory()->create([
        'company_id' => $company->id,
        'role_id' => $adminRole?->id,
        'is_superadmin' => false,
    ]);
}

function createRoleViewerNoRolePermissions(Company $company): User
{
    $viewerRole = Role::where('name', 'Viewer')->first();

    return User::factory()->create([
        'company_id' => $company->id,
        'role_id' => $viewerRole?->id,
        'is_superadmin' => false,
    ]);
}

beforeEach(function (): void {
    foreach (
        [
            CompanySeeder::class,
            PermissionSeeder::class,
            RoleSeeder::class,
            FeatureSeeder::class,
        ] as $seeder
    ) {
        Artisan::call('db:seed', ['--class' => $seeder]);
    }
});

describe('role index', function (): void {
    it('superadmin sees all roles paginated', function (): void {
        $superadmin = createRoleSuperadmin();

        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $featureIds = Feature::query()->where('group', '!=', 'admin')->limit(2)->pluck('id')->values()->all();
        $permissionIds = Permission::query()->limit(2)->pluck('id')->values()->all();

        $networkA = Network::factory()->create();
        $companyA->networks()->attach($networkA->id);
        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyA->id,
                'name' => 'Role A',
                'feature_ids' => $featureIds,
                'permission_ids' => $permissionIds,
                'network_ids' => [$networkA->id],
            ])->assertStatus(201);

        actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyB->id,
                'name' => 'Role B',
                'feature_ids' => $featureIds,
                'permission_ids' => $permissionIds,
                'network_ids' => [$networkB->id],
            ])->assertStatus(201);

        $response = actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/roles?per_page=15');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'is_system_role',
                        'company',
                        'features',
                        'permissions',
                        'networks',
                        'features_count',
                        'permissions_count',
                        'networks_count',
                        'users_count',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'links',
                'meta',
            ]);

        $data = $response->json('data');
        $companyIds = collect($data)->pluck('company.id')->values()->all();
        expect($companyIds)->toBeArray();
        expect(count($data))->toBeGreaterThanOrEqual(2);
    });

    it('superadmin filters by ?company_id', function (): void {
        $superadmin = createRoleSuperadmin();

        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $featureIds = Feature::query()->where('group', '!=', 'admin')->limit(1)->pluck('id')->values()->all();
        $permissionIds = Permission::query()->limit(1)->pluck('id')->values()->all();

        $networkA = Network::factory()->create();
        $companyA->networks()->attach($networkA->id);
        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyA->id,
                'name' => 'Role A',
                'feature_ids' => $featureIds,
                'permission_ids' => $permissionIds,
                'network_ids' => [$networkA->id],
            ])->assertStatus(201);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyB->id,
                'name' => 'Role B',
                'feature_ids' => $featureIds,
                'permission_ids' => $permissionIds,
                'network_ids' => [$networkB->id],
            ])->assertStatus(201);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/roles?company_id={$companyA->id}");

        $response->assertStatus(200);
        $data = $response->json('data');

        expect($data)->toBeArray();
        foreach ($data as $role) {
            expect((int) $role['company']['id'])->toBe((int) $companyA->id);
        }
    });

    it('company admin sees only own company roles', function (): void {
        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $admin = createRoleCompanyAdmin($companyA);

        $featureIds = Feature::query()->where('group', '!=', 'admin')->limit(1)->pluck('id')->values()->all();
        $permissionIds = Permission::query()->limit(1)->pluck('id')->values()->all();

        $networkA = Network::factory()->create();
        $companyA->networks()->attach($networkA->id);
        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        // Create roles via superadmin so we don't depend on company-admin creating rights here.
        $superadmin = createRoleSuperadmin();
        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyA->id,
                'name' => 'Role A',
                'feature_ids' => $featureIds,
                'permission_ids' => $permissionIds,
                'network_ids' => [$networkA->id],
            ])->assertStatus(201);

        $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyB->id,
                'name' => 'Role B',
                'feature_ids' => $featureIds,
                'permission_ids' => $permissionIds,
                'network_ids' => [$networkB->id],
            ])->assertStatus(201);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/roles?per_page=15');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect($data)->toBeArray();

        foreach ($data as $role) {
            expect((int) $role['company']['id'])->toBe((int) $companyA->id);
        }
    });

    it('unauthenticated requests → 401', function (): void {
        $response = $this->getJson('/api/v1/roles');
        $response->assertStatus(401);
    });

    it('no role.view permission → 403', function (): void {
        $company = Company::first();
        $user = createRoleViewerNoRolePermissions($company);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/roles');

        $response->assertStatus(403);
    });
});

describe('role show', function (): void {
    it('includes company, features, permissions, networks, and all counts', function (): void {
        $superadmin = createRoleSuperadmin();

        $company = Company::where('code', 'ACME')->first();
        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $dashboard = Feature::where('key', 'dashboard')->first();
        $nodes = Feature::where('key', 'nodes')->first();
        expect($dashboard)->not->toBeNull();
        expect($nodes)->not->toBeNull();

        $permissionA = Permission::query()->first();
        $permissionB = Permission::query()->skip(1)->first();
        expect($permissionA)->not->toBeNull();
        expect($permissionB)->not->toBeNull();

        $roleResponse = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Operator Role',
                'feature_ids' => [$nodes->id, $dashboard->id], // intentionally unsorted
                'permission_ids' => [$permissionA->id, $permissionB->id],
                'network_ids' => [$network->id],
            ])->assertStatus(201);

        $roleId = $roleResponse->json('id');

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/roles/{$roleId}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'name',
                'is_system_role',
                'company' => ['id', 'name', 'code'],
                'features' => [['id', 'key', 'name', 'icon']],
                'permissions' => [['id', 'key', 'display_name']],
                'networks' => [['id', 'name', 'network_address']],
                'features_count',
                'permissions_count',
                'networks_count',
                'users_count',
                'created_at',
                'updated_at',
            ]);

        // Features must be ordered by sort_order ASC in the response
        $featureKeys = array_map(static fn (array $f): string => $f['key'], $response->json('features'));
        expect($featureKeys)->toEqual(['dashboard', 'nodes']);
    });

    it('company admin cannot view another company role → 403', function (): void {
        $superadmin = createRoleSuperadmin();

        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        $feature = Feature::where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $roleResponse = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyB->id,
                'name' => 'Role B',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$networkB->id],
            ])->assertStatus(201);

        $roleId = $roleResponse->json('id');

        $adminA = createRoleCompanyAdmin($companyA);
        $response = $this->actingAs($adminA, 'sanctum')
            ->getJson("/api/v1/roles/{$roleId}");

        $response->assertStatus(403);
    });
});

describe('role store', function (): void {
    it('superadmin creates role for any company; all three pivots synced', function (): void {
        $superadmin = createRoleSuperadmin();

        $company = Company::where('code', 'ACME')->first();
        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $features = Feature::query()->where('group', '!=', 'admin')->limit(2)->pluck('id')->values()->all();
        $permissions = Permission::query()->limit(2)->pluck('id')->values()->all();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'New Role',
                'feature_ids' => $features,
                'permission_ids' => $permissions,
                'network_ids' => [$network->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('id', $response->json('id'));

        $role = Role::find($response->json('id'));
        expect($role)->not->toBeNull();
        expect($role->features()->count())->toBe(2);
        expect($role->permissions()->count())->toBe(2);
        expect($role->networks()->count())->toBe(1);
    });

    it('company admin creates role (company_id auto-applied)', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $admin = createRoleCompanyAdmin($company);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $features = Feature::query()->where('group', '!=', 'admin')->limit(1)->pluck('id')->values()->all();
        $permissions = Permission::query()->limit(1)->pluck('id')->values()->all();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'name' => 'Company Role',
                'feature_ids' => $features,
                'permission_ids' => $permissions,
                'network_ids' => [$network->id],
            ]);

        $response->assertStatus(201);
        $role = Role::find($response->json('id'));
        expect($role)->not->toBeNull();
        expect($role->companies()->pluck('company_id')->all())->toContain($company->id);
    });

    it('superadmin creates multi-company role via company_ids (and validates network_ids across companies)', function (): void {
        $superadmin = createRoleSuperadmin();

        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $networkA = Network::factory()->create();
        $companyA->networks()->attach($networkA->id);

        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        $features = Feature::query()->where('group', '!=', 'admin')->limit(2)->pluck('id')->values()->all();
        $permissions = Permission::query()->limit(2)->pluck('id')->values()->all();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_ids' => [$companyA->id, $companyB->id],
                'name' => 'Multi-Company Role',
                'feature_ids' => $features,
                'permission_ids' => $permissions,
                // Assign a network that only belongs to companyA.
                'network_ids' => [$networkA->id],
            ]);

        $response->assertStatus(201);

        $roleId = $response->json('id');
        $role = Role::find($roleId);
        expect($role)->not->toBeNull();

        $companyIds = $role->companies()->pluck('company_id')->values()->all();
        expect($companyIds)->toContain($companyA->id);
        expect($companyIds)->toContain($companyB->id);

        $responseCompanyIds = collect($response->json('companies'))->pluck('id')->values()->all();
        expect($responseCompanyIds)->toContain($companyA->id);
        expect($responseCompanyIds)->toContain($companyB->id);

        // Runtime check: user in companyB should not see networkA.
        $userInB = User::factory()->create([
            'company_id' => $companyB->id,
            'role_id' => $roleId,
            'is_superadmin' => false,
        ]);

        $authResponse = $this->actingAs($userInB, 'sanctum')
            ->getJson('/api/v1/auth/me');

        $authResponse->assertStatus(200);
        $authNetworks = $authResponse->json('networks');
        expect($authNetworks)->toBeArray();
        expect(count($authNetworks))->toBe(0);
    });

    it('superadmin can add a company to an existing role via company_ids without network updates', function (): void {
        $superadmin = createRoleSuperadmin();

        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $networkA = Network::factory()->create();
        $companyA->networks()->attach($networkA->id);
        $companyB->networks()->attach(Network::factory()->create()->id);

        $features = Feature::query()->where('group', '!=', 'admin')->limit(1)->pluck('id')->values()->all();
        $permissions = Permission::query()->limit(1)->pluck('id')->values()->all();

        $createResponse = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_ids' => [$companyA->id],
                'name' => 'Reuse Role',
                'feature_ids' => $features,
                'permission_ids' => $permissions,
                'network_ids' => [$networkA->id],
            ]);

        $createResponse->assertStatus(201);
        $roleId = $createResponse->json('id');

        $updateResponse = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'company_ids' => [$companyA->id, $companyB->id],
            ]);

        $updateResponse->assertStatus(200);

        $role = Role::find($roleId);
        $companyIds = $role->companies()->pluck('company_id')->values()->all();
        expect($companyIds)->toContain($companyA->id);
        expect($companyIds)->toContain($companyB->id);

        // Network pivot should remain unchanged (still only networkA).
        expect($role->networks()->pluck('network_id')->values()->all())->toEqual([$networkA->id]);
    });

    it('company admin sends company_id → 422 prohibited', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $admin = createRoleCompanyAdmin($company);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Forbidden',
                'feature_ids' => [],
                'permission_ids' => [],
                'network_ids' => [],
            ]);

        $response->assertStatus(422);
    });

    it('company admin sends is_system_role → 422 prohibited', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $admin = createRoleCompanyAdmin($company);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'name' => 'Forbidden System',
                'is_system_role' => true,
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ]);

        $response->assertStatus(422);
    });

    it('admin group feature_id → 422', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $admin = createRoleCompanyAdmin($company);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $adminFeature = Feature::where('group', 'admin')->first();
        $permission = Permission::query()->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'name' => 'Forbidden Feature',
                'feature_ids' => [$adminFeature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ]);

        $response->assertStatus(422);
    });

    it('is_active=false feature_id → 422', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $admin = createRoleCompanyAdmin($company);

        $feature = Feature::where('group', '!=', 'admin')->first();
        $feature->update(['is_active' => false]);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $permission = Permission::query()->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'name' => 'Inactive Feature Role',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ]);

        $response->assertStatus(422);
    });

    it('network_id not in company_networks → 422', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $admin = createRoleCompanyAdmin($company);

        $allowedNetwork = Network::factory()->create();
        $company->networks()->attach($allowedNetwork->id);

        $notAllowedNetwork = Network::factory()->create();

        $feature = Feature::where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'name' => 'Bad Network',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$notAllowedNetwork->id],
            ]);

        $response->assertStatus(422);
    });

    it('empty feature_ids creates role with no features', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $admin = createRoleCompanyAdmin($company);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $permission = Permission::query()->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'name' => 'No Features',
                'feature_ids' => [],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ]);

        $response->assertStatus(201);
        $role = Role::find($response->json('id'));
        expect($role->features()->count())->toBe(0);
    });

    it('no role.create → 403', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $viewer = createRoleViewerNoRolePermissions($company);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $response = $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/v1/roles', [
                'name' => 'No Create',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ]);

        $response->assertStatus(403);
    });
});

describe('role update', function (): void {
    it('superadmin updates any role', function (): void {
        $superadmin = createRoleSuperadmin();

        $company = Company::where('code', 'ACME')->first();
        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $features = Feature::query()->where('group', '!=', 'admin')->limit(2)->pluck('id')->values()->all();
        $permissions = Permission::query()->limit(1)->pluck('id')->values()->all();

        $role = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Old Name',
                'feature_ids' => [$features[0]],
                'permission_ids' => [$permissions[0]],
                'network_ids' => [$network->id],
            ])->json();

        $targetId = (int) $role['id'];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/roles/{$targetId}", [
                'name' => 'New Name',
                'feature_ids' => [$features[1]],
            ]);

        $response->assertStatus(200);
        expect(Role::find($targetId)->name)->toBe('New Name');
        expect(Role::find($targetId)->features()->count())->toBe(1);
    });

    it('company admin updates own company role', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $admin = createRoleCompanyAdmin($company);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $featureA = Feature::query()->where('group', '!=', 'admin')->first();
        $featureB = Feature::query()->where('group', '!=', 'admin')->skip(1)->first();
        $permission = Permission::query()->first();

        $roleResponse = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'name' => 'Role To Update',
                'feature_ids' => [$featureA->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->assertStatus(201);

        $roleId = (int) $roleResponse->json('id');

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'name' => 'Updated Role',
                'feature_ids' => [$featureB->id],
            ]);

        $response->assertStatus(200);
        expect(Role::find($roleId)->name)->toBe('Updated Role');
    });

    it('company admin cannot update another company role → 403', function (): void {
        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $adminA = createRoleCompanyAdmin($companyA);

        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $superadmin = createRoleSuperadmin();
        $roleResponse = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyB->id,
                'name' => 'Role B',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$networkB->id],
            ])->assertStatus(201);

        $roleId = (int) $roleResponse->json('id');

        $response = $this->actingAs($adminA, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'name' => 'Should Fail',
            ]);

        $response->assertStatus(403);
    });

    it('company_id in PUT body → 422 prohibited', function (): void {
        $superadmin = createRoleSuperadmin();
        $company = Company::where('code', 'ACME')->first();

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Role',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'name' => 'Role',
                'company_id' => $company->id,
            ]);

        $response->assertStatus(422);
    });

    it('is_system_role=true role → 403', function (): void {
        $superadmin = createRoleSuperadmin();
        $company = Company::where('code', 'ACME')->first();

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'System Role',
                'is_system_role' => true,
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'name' => 'Try Update',
            ]);

        $response->assertStatus(403);
    });

    it('omitting feature_ids leaves feature pivot unchanged', function (): void {
        $superadmin = createRoleSuperadmin();
        $company = Company::where('code', 'ACME')->first();

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $featureA = Feature::query()->where('group', '!=', 'admin')->first();
        $featureB = Feature::query()->where('group', '!=', 'admin')->skip(1)->first();
        $permission = Permission::query()->first();

        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Role',
                'feature_ids' => [$featureA->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'name' => 'Renamed',
                // omit feature_ids
            ])->assertStatus(200);

        $role = Role::find($roleId);
        $keys = $role->features->pluck('key')->values()->all();
        expect($keys)->toEqual([$featureA->key]);
    });

    it('sending feature_ids: [] clears all features', function (): void {
        $superadmin = createRoleSuperadmin();
        $company = Company::where('code', 'ACME')->first();

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $featureA = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Role',
                'feature_ids' => [$featureA->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'feature_ids' => [],
            ])->assertStatus(200);

        $role = Role::find($roleId);
        expect($role->features()->count())->toBe(0);
    });

    it('network not in company_networks → 422', function (): void {
        $superadmin = createRoleSuperadmin();
        $company = Company::where('code', 'ACME')->first();

        $allowedNetwork = Network::factory()->create();
        $company->networks()->attach($allowedNetwork->id);
        $notAllowedNetwork = Network::factory()->create();

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Role',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$allowedNetwork->id],
            ])->json('id');

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'network_ids' => [$notAllowedNetwork->id],
            ]);

        $response->assertStatus(422);
    });

    it('no role.update → 403', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $viewer = createRoleViewerNoRolePermissions($company);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $superadmin = createRoleSuperadmin();
        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Role',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        $response = $this->actingAs($viewer, 'sanctum')
            ->putJson("/api/v1/roles/{$roleId}", [
                'name' => 'Should Fail',
            ]);

        $response->assertStatus(403);
    });
});

describe('role destroy', function (): void {
    it('superadmin deletes non-system role with no users → 204', function (): void {
        $superadmin = createRoleSuperadmin();
        $company = Company::where('code', 'ACME')->first();

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Role',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        $response = $this->actingAs($superadmin, 'sanctum')
            ->deleteJson("/api/v1/roles/{$roleId}");

        $response->assertStatus(204);
        expect(Role::find($roleId))->toBeNull();
    });

    it('is_system_role=true role → 403', function (): void {
        $superadmin = createRoleSuperadmin();
        $company = Company::where('code', 'ACME')->first();

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'System Role',
                'is_system_role' => true,
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        $response = $this->actingAs($superadmin, 'sanctum')
            ->deleteJson("/api/v1/roles/{$roleId}");

        $response->assertStatus(403);
    });

    it('role with users → 409', function (): void {
        $superadmin = createRoleSuperadmin();
        $company = Company::where('code', 'ACME')->first();

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Role',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        User::factory()->create([
            'company_id' => $company->id,
            'role_id' => $roleId,
            'is_superadmin' => false,
        ]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->deleteJson("/api/v1/roles/{$roleId}");

        $response->assertStatus(409)
            ->assertJsonFragment(['message' => 'Role has active users and cannot be deleted.']);
    });

    it('company admin cannot delete another company role → 403', function (): void {
        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $adminA = createRoleCompanyAdmin($companyA);

        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $superadmin = createRoleSuperadmin();
        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $companyB->id,
                'name' => 'Role B',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$networkB->id],
            ])->json('id');

        $response = $this->actingAs($adminA, 'sanctum')
            ->deleteJson("/api/v1/roles/{$roleId}");

        $response->assertStatus(403);
    });

    it('no role.delete → 403', function (): void {
        $company = Company::where('code', 'ACME')->first();
        $viewer = createRoleViewerNoRolePermissions($company);

        $network = Network::factory()->create();
        $company->networks()->attach($network->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $superadmin = createRoleSuperadmin();
        $roleId = (int) $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/roles', [
                'company_id' => $company->id,
                'name' => 'Role',
                'feature_ids' => [$feature->id],
                'permission_ids' => [$permission->id],
                'network_ids' => [$network->id],
            ])->json('id');

        $response = $this->actingAs($viewer, 'sanctum')
            ->deleteJson("/api/v1/roles/{$roleId}");

        $response->assertStatus(403);
    });
});

describe('role options', function (): void {
    it('company admin gets own company roles only', function (): void {
        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $admin = createRoleCompanyAdmin($companyA);

        $networkA = Network::factory()->create();
        $companyA->networks()->attach($networkA->id);
        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $superadmin = createRoleSuperadmin();
        $this->actingAs($superadmin, 'sanctum')->postJson('/api/v1/roles', [
            'company_id' => $companyA->id,
            'name' => 'Role A',
            'feature_ids' => [$feature->id],
            'permission_ids' => [$permission->id],
            'network_ids' => [$networkA->id],
        ])->assertStatus(201);

        $this->actingAs($superadmin, 'sanctum')->postJson('/api/v1/roles', [
            'company_id' => $companyB->id,
            'name' => 'Role B',
            'feature_ids' => [$feature->id],
            'permission_ids' => [$permission->id],
            'network_ids' => [$networkB->id],
        ])->assertStatus(201);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/roles/options');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'name', 'is_system_role']]]);

        $data = $response->json('data');
        foreach ($data as $role) {
            expect($role)->not->toHaveKey('company');
            expect($role)->not->toHaveKey('features');
            expect($role)->not->toHaveKey('permissions');
            expect($role)->not->toHaveKey('networks');
        }
    });

    it('superadmin with ?company_id gets that company roles', function (): void {
        $superadmin = createRoleSuperadmin();

        $companyA = Company::where('code', 'ACME')->first();
        $companyB = Company::where('code', 'GLOBEX')->first();

        $networkA = Network::factory()->create();
        $companyA->networks()->attach($networkA->id);
        $networkB = Network::factory()->create();
        $companyB->networks()->attach($networkB->id);

        $feature = Feature::query()->where('group', '!=', 'admin')->first();
        $permission = Permission::query()->first();

        $this->actingAs($superadmin, 'sanctum')->postJson('/api/v1/roles', [
            'company_id' => $companyA->id,
            'name' => 'Role A',
            'feature_ids' => [$feature->id],
            'permission_ids' => [$permission->id],
            'network_ids' => [$networkA->id],
        ])->assertStatus(201);

        $this->actingAs($superadmin, 'sanctum')->postJson('/api/v1/roles', [
            'company_id' => $companyB->id,
            'name' => 'Role B',
            'feature_ids' => [$feature->id],
            'permission_ids' => [$permission->id],
            'network_ids' => [$networkB->id],
        ])->assertStatus(201);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/roles/options?company_id={$companyA->id}");

        $response->assertStatus(200);
        $data = $response->json('data');
        expect($data)->toBeArray();

        foreach ($data as $role) {
            // Only id/name/is_system_role keys exist
            expect(array_keys($role))->toEqualCanonicalizing(['id', 'name', 'is_system_role']);
        }
    });

    it('unauthenticated access to /options → 401', function (): void {
        $response = $this->getJson('/api/v1/roles/options');
        $response->assertStatus(401);
    });
});
