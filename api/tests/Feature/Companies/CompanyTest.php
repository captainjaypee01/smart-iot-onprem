<?php

declare(strict_types=1);

// tests/Feature/Companies/CompanyTest.php

use App\Models\Company;
use App\Models\Network;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function createCompanySuperadmin(): User
{
    return User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);
}

function createCompanyAdmin(Company $company): User
{
    $user = User::factory()->create([
        'company_id' => $company->id,
        'is_superadmin' => false,
    ]);

    $permission = Permission::firstOrCreate(
        ['key' => 'company.update'],
        ['display_name' => 'Update Company', 'module' => 'company']
    );

    $role = Role::create([
        'name' => 'Company Admin',
        'description' => 'Company admin for testing',
        'is_system_role' => false,
    ]);

    $role->permissions()->attach($permission->id);
    $user->role()->associate($role);
    $user->save();

    return $user;
}

describe('company index', function (): void {
    it('allows superadmin to list companies with paginated response shape', function (): void {
        $superadmin = createCompanySuperadmin();

        Company::factory()->count(3)->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/companies');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'code',
                        'name',
                        'address',
                        'contact_email',
                        'contact_phone',
                        'timezone',
                        'logo_url',
                        'login_attempts',
                        'is_2fa_enforced',
                        'is_demo',
                        'is_active_zone',
                        'is_active',
                        'custom_alarm_threshold',
                        'custom_alarm_threshold_unit',
                        'networks',
                        'networks_count',
                        'users_count',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'links',
                'meta',
            ]);
    });

    it('applies search filter on name and code', function (): void {
        $superadmin = createCompanySuperadmin();

        Company::factory()->create([
            'name' => 'Acme Corporation',
            'code' => 'ACME',
        ]);

        Company::factory()->create([
            'name' => 'Other Company',
            'code' => 'OTHER',
        ]);

        $byName = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/companies?search=Acme');

        $byName->assertStatus(200);
        $data = $byName->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['name'])->toBe('Acme Corporation');

        $byCode = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/companies?search=OTHER');

        $byCode->assertStatus(200);
        $data = $byCode->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['code'])->toBe('OTHER');
    });

    it('filters by is_active flag', function (): void {
        $superadmin = createCompanySuperadmin();

        Company::factory()->create(['is_active' => true]);
        Company::factory()->create(['is_active' => false]);

        $inactive = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/companies?is_active=0');

        $inactive->assertStatus(200);
        foreach ($inactive->json('data') as $row) {
            expect($row['is_active'])->toBeFalse();
        }
    });

    it('filters by is_demo flag', function (): void {
        $superadmin = createCompanySuperadmin();

        Company::factory()->create(['is_demo' => true]);
        Company::factory()->create(['is_demo' => false]);

        $demo = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/companies?is_demo=1');

        $demo->assertStatus(200);
        foreach ($demo->json('data') as $row) {
            expect($row['is_demo'])->toBeTrue();
        }
    });

    it('forbids non-superadmin from listing companies', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/companies');

        $response->assertStatus(403);
    });

    it('requires authentication to list companies', function (): void {
        $response = $this->getJson('/api/v1/companies');

        $response->assertStatus(401);
    });
});

describe('company show', function (): void {
    it('allows superadmin to view any company with related counts', function (): void {
        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create();
        $networkIds = Network::factory()->count(2)->create()->pluck('id')->all();
        $company->networks()->attach($networkIds);
        User::factory()->count(3)->create(['company_id' => $company->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/companies/{$company->id}");

        $response->assertStatus(200);
        $data = $response->json();
        expect($data['networks_count'])->toBe(2);
        expect($data['users_count'])->toBe(3);
        expect($data['networks'])->toBeArray();
    });

    it('sets logo_url null when logo_path is null', function (): void {
        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create(['logo_path' => null]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/v1/companies/{$company->id}");

        $response->assertStatus(200)
            ->assertJsonPath('logo_url', null);
    });

    it('allows company admin to view their own company only', function (): void {
        $company = Company::factory()->create();
        $other = Company::factory()->create();
        $admin = createCompanyAdmin($company);

        $own = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/companies/{$company->id}");
        $own->assertStatus(200);

        $otherResp = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/companies/{$other->id}");
        $otherResp->assertStatus(403);
    });
});

describe('company store', function (): void {
    it('allows superadmin to create a company with all fields', function (): void {
        $superadmin = createCompanySuperadmin();
        $network = Network::factory()->create();

        $payload = [
            'name' => 'Acme Corp',
            'code' => 'acme',
            'address' => '123 Main St',
            'contact_email' => 'admin@acme.com',
            'contact_phone' => '+65 1234 5678',
            'timezone' => 'Asia/Singapore',
            'login_attempts' => 7,
            'is_2fa_enforced' => true,
            'is_demo' => true,
            'is_active_zone' => false,
            'is_active' => true,
            'custom_alarm_threshold' => 10,
            'custom_alarm_threshold_unit' => 'minutes',
            'network_ids' => [$network->id],
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/companies', $payload);

        $response->assertStatus(201);
        $data = $response->json();

        expect($data['code'])->toBe('ACME');
        expect($data['name'])->toBe('Acme Corp');
        expect($data['custom_alarm_threshold'])->toBe(10);
        expect($data['custom_alarm_threshold_unit'])->toBe('minutes');

        $company = Company::firstWhere('code', 'ACME');
        expect($company)->not->toBeNull();
        expect($company->networks()->pluck('networks.id')->all())->toEqual([$network->id]);
    });

    it('allows superadmin to create a company with minimal fields', function (): void {
        $superadmin = createCompanySuperadmin();

        $payload = [
            'name' => 'Minimal Co',
            'code' => 'MIN',
            'timezone' => 'UTC',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/companies', $payload);

        $response->assertStatus(201);
        $data = $response->json();
        expect($data['name'])->toBe('Minimal Co');
        expect($data['code'])->toBe('MIN');
    });

    it('stores code uppercase regardless of input case', function (): void {
        $superadmin = createCompanySuperadmin();

        $payload = [
            'name' => 'Case Co',
            'code' => 'caseco',
            'timezone' => 'UTC',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/companies', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('code', 'CASECO');
    });

    it('rejects invalid timezone', function (): void {
        $superadmin = createCompanySuperadmin();

        $payload = [
            'name' => 'Bad TZ',
            'code' => 'BADTZ',
            'timezone' => 'Not/AZone',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/companies', $payload);

        $response->assertStatus(422);
    });

    it('rejects duplicate code', function (): void {
        $superadmin = createCompanySuperadmin();
        Company::factory()->create(['code' => 'DUPLICATE']);

        $payload = [
            'name' => 'Dup',
            'code' => 'DUPLICATE',
            'timezone' => 'UTC',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/companies', $payload);

        $response->assertStatus(422);
    });

    it('rejects code that does not match regex (lowercase with space)', function (): void {
        $superadmin = createCompanySuperadmin();

        $payload = [
            'name' => 'Lower',
            'code' => 'lower code',
            'timezone' => 'UTC',
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/companies', $payload);

        $response->assertStatus(422);
    });

    it('rejects custom_alarm_threshold without unit', function (): void {
        $superadmin = createCompanySuperadmin();

        $payload = [
            'name' => 'Alarm Co',
            'code' => 'ALARM',
            'timezone' => 'UTC',
            'custom_alarm_threshold' => 10,
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson('/api/v1/companies', $payload);

        $response->assertStatus(422);
    });

    it('forbids non-superadmin from creating a company', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);

        $payload = [
            'name' => 'Forbidden',
            'code' => 'FORBID',
            'timezone' => 'UTC',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/companies', $payload);

        $response->assertStatus(403);
    });
});

describe('company update', function (): void {
    it('allows superadmin to update all fields', function (): void {
        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create([
            'name' => 'Original',
            'code' => 'ORIG',
            'timezone' => 'UTC',
        ]);

        $network = Network::factory()->create();

        $payload = [
            'name' => 'Updated',
            'address' => 'New Address',
            'contact_email' => 'new@example.com',
            'contact_phone' => '+65 0000 0000',
            'timezone' => 'Asia/Singapore',
            'login_attempts' => 9,
            'is_2fa_enforced' => true,
            'is_demo' => true,
            'is_active_zone' => false,
            'is_active' => false,
            'custom_alarm_threshold' => 15,
            'custom_alarm_threshold_unit' => 'hours',
            'network_ids' => [$network->id],
        ];

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/companies/{$company->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('name', 'Updated')
            ->assertJsonPath('timezone', 'Asia/Singapore')
            ->assertJsonPath('is_demo', true);
    });

    it('syncs network_ids pivot when provided and honours omit/empty semantics', function (): void {
        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create();
        $network1 = Network::factory()->create();
        $network2 = Network::factory()->create();

        // initial attach
        $company->networks()->attach($network1->id);

        // update with new set
        $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/companies/{$company->id}", [
                'network_ids' => [$network2->id],
            ])
            ->assertStatus(200);

        $company->refresh();
        expect($company->networks()->pluck('networks.id')->all())
            ->toEqual([$network2->id]);

        // omit network_ids -> no change
        $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/companies/{$company->id}", [
                'name' => 'No Pivot Change',
            ])
            ->assertStatus(200);

        $company->refresh();
        expect($company->networks()->pluck('networks.id')->all())
            ->toEqual([$network2->id]);

        // empty array clears pivot
        $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/companies/{$company->id}", [
                'network_ids' => [],
            ])
            ->assertStatus(200);

        $company->refresh();
        expect($company->networks()->count())->toBe(0);
    });

    it('allows company admin to update only allowed fields on own company', function (): void {
        $company = Company::factory()->create([
            'name' => 'Original',
            'timezone' => 'UTC',
            'login_attempts' => 5,
            'is_2fa_enforced' => false,
        ]);
        $admin = createCompanyAdmin($company);

        $payload = [
            'name' => 'New Name',
            'address' => 'New Addr',
            'contact_email' => 'owner@example.com',
            'contact_phone' => '+65 9999 9999',
            'timezone' => 'Asia/Singapore',
            'login_attempts' => 8,
            'is_2fa_enforced' => true,
        ];

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/companies/{$company->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('name', 'New Name')
            ->assertJsonPath('timezone', 'Asia/Singapore')
            ->assertJsonPath('login_attempts', 8)
            ->assertJsonPath('is_2fa_enforced', true);
    });

    it('rejects prohibited fields for company admin with 422', function (): void {
        $company = Company::factory()->create();
        $admin = createCompanyAdmin($company);

        $payload = [
            'code' => 'SHOULDFAIL',
            'is_demo' => true,
            'is_active' => false,
            'network_ids' => [],
        ];

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/companies/{$company->id}", $payload);

        $response->assertStatus(422);
    });

    it('rejects code on update for all callers', function (): void {
        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->putJson("/api/v1/companies/{$company->id}", [
                'code' => 'NEWCODE',
            ]);

        $response->assertStatus(422);
    });

    it('forbids company admin from updating another company', function (): void {
        $company = Company::factory()->create();
        $other = Company::factory()->create();
        $admin = createCompanyAdmin($company);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/companies/{$other->id}", [
                'name' => 'Forbidden',
            ]);

        $response->assertStatus(403);
    });
});

describe('company destroy', function (): void {
    it('allows superadmin to delete company without users', function (): void {
        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')
            ->deleteJson("/api/v1/companies/{$company->id}");

        $response->assertStatus(204);
        expect(Company::find($company->id))->toBeNull();
    });

    it('returns 409 when company has active users', function (): void {
        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create();
        User::factory()->create(['company_id' => $company->id]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->deleteJson("/api/v1/companies/{$company->id}");

        $response->assertStatus(409);
    });

    it('forbids non-superadmin from deleting a company', function (): void {
        $user = User::factory()->create(['is_superadmin' => false]);
        $company = Company::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/companies/{$company->id}");

        $response->assertStatus(403);
    });
});

describe('company options', function (): void {
    it('superadmin sees all active companies', function (): void {
        $superadmin = createCompanySuperadmin();
        $active1 = Company::factory()->create(['is_active' => true]);
        $active2 = Company::factory()->create(['is_active' => true]);
        Company::factory()->create(['is_active' => false]);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->getJson('/api/v1/companies/options');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect($data)->toHaveCount(2);
        $ids = array_column($data, 'id');
        expect($ids)->toContain($active1->id, $active2->id);
    });

    it('company admin sees only their own active company', function (): void {
        $company = Company::factory()->create(['is_active' => true]);
        Company::factory()->create(['is_active' => true]);
        $admin = createCompanyAdmin($company);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/companies/options');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect($data)->toHaveCount(1);
        expect($data[0]['id'])->toBe($company->id);
    });

    it('requires authentication for options', function (): void {
        $response = $this->getJson('/api/v1/companies/options');

        $response->assertStatus(401);
    });
});

describe('company logo upload', function (): void {
    it('allows superadmin to upload a logo and returns updated resource', function (): void {
        Storage::fake('local');

        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create(['logo_path' => null]);

        $file = UploadedFile::fake()->image('logo.png')->size(500);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/companies/{$company->id}/logo", [
                'logo' => $file,
            ]);

        $response->assertStatus(200);
        $data = $response->json();
        expect($data['logo_url'])->not->toBeNull();
    });

    it('allows company admin to upload logo for own company only', function (): void {
        Storage::fake('local');

        $company = Company::factory()->create(['logo_path' => null]);
        $other = Company::factory()->create(['logo_path' => null]);
        $admin = createCompanyAdmin($company);

        $file = UploadedFile::fake()->image('logo.png')->size(500);

        $own = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/companies/{$company->id}/logo", ['logo' => $file]);
        $own->assertStatus(200);

        $otherResp = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/companies/{$other->id}/logo", ['logo' => $file]);
        $otherResp->assertStatus(403);
    });

    it('rejects invalid file type and oversized files', function (): void {
        Storage::fake('local');

        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create();

        $pdf = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');
        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/companies/{$company->id}/logo", ['logo' => $pdf]);
        $response->assertStatus(422);

        $bigImage = UploadedFile::fake()->image('big.png')->size(3000);
        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/companies/{$company->id}/logo", ['logo' => $bigImage]);
        $response->assertStatus(422);
    });

    it('deletes old logo file when new one is uploaded', function (): void {
        Storage::fake('local');

        $superadmin = createCompanySuperadmin();
        $company = Company::factory()->create(['logo_path' => 'logos/old.png']);
        Storage::disk()->put('logos/old.png', 'dummy');

        $newFile = UploadedFile::fake()->image('new.png')->size(500);

        $response = $this->actingAs($superadmin, 'sanctum')
            ->postJson("/api/v1/companies/{$company->id}/logo", ['logo' => $newFile]);

        $response->assertStatus(200);

        Storage::disk()->assertMissing('logos/old.png');
    });
});

