<?php

declare(strict_types=1);

// tests/Feature/UserManagementTest.php

use App\Models\Company;
use App\Models\User;
use App\Notifications\WelcomeUserNotification;
use Database\Seeders\CompanySeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed([
        CompanySeeder::class,
        PermissionSeeder::class,
        RoleSeeder::class,
    ]);
});

test('unauthenticated requests to user list return 401', function (): void {
    $response = $this->getJson('/api/v1/users');

    $response->assertStatus(401);
});

test('GET /api/v1/companies/options returns companies for superadmin', function (): void {
    $superadmin = User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);

    $response = $this->actingAs($superadmin, 'sanctum')
        ->getJson('/api/v1/companies/options');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => [['id', 'name', 'code']]]);

    $data = $response->json('data');
    expect($data)->toBeArray();
    expect(count($data))->toBeGreaterThan(0);
});

test('GET /api/v1/companies/options returns only own company for company admin', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/companies/options');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => [['id', 'name', 'code']]]);

    $data = $response->json('data');
    expect($data)->toBeArray();
    expect(count($data))->toBe(1);
    expect($data[0]['id'])->toBe($acme->id);
});

test('GET /api/v1/roles/options returns roles for company', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/roles/options');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => [['id', 'name', 'is_system_role']]]);
    $data = $response->json('data');
    expect($data)->toBeArray();
    expect(count($data))->toBeGreaterThan(0);
});

test('superadmin must pass company_id to GET /api/v1/roles/options', function (): void {
    $superadmin = User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);

    $response = $this->actingAs($superadmin, 'sanctum')
        ->getJson('/api/v1/roles/options');

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'The company_id query parameter is required for superadmin.']);
});

test('superadmin can list all users', function (): void {
    $superadmin = User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);
    $company = Company::first();
    $role = \App\Models\Role::where('name', 'Admin')->first();
    User::factory()->create(['company_id' => $company->id, 'role_id' => $role->id, 'name' => 'User A']);
    User::factory()->create(['company_id' => $company->id, 'role_id' => $role->id, 'name' => 'User B']);

    $response = $this->actingAs($superadmin, 'sanctum')
        ->getJson('/api/v1/users');

    $response->assertStatus(200);
    $data = $response->json('data');
    expect($data)->toBeArray();
    expect(count($data))->toBeGreaterThanOrEqual(2);
});

test('company admin only sees own company users', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $globex = Company::where('code', 'GLOBEX')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);
    User::factory()->create(['company_id' => $acme->id, 'role_id' => $adminRole->id, 'name' => 'Acme User']);
    User::factory()->create(['company_id' => $globex->id, 'role_id' => $adminRole->id, 'name' => 'Globex User']);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/users');

    $response->assertStatus(200);
    $data = $response->json('data');
    expect($data)->toBeArray();
    foreach ($data as $user) {
        expect($user['company']['id'] ?? null)->toBe($acme->id);
    }
});

test('non-admin gets 403 on list', function (): void {
    $viewerRole = \App\Models\Role::where('name', 'Viewer')->first();
    $acme = Company::where('code', 'ACME')->first();
    $viewer = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $viewerRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($viewer, 'sanctum')
        ->getJson('/api/v1/users');

    $response->assertStatus(403);
});

test('admin can create user and welcome notification is sent', function (): void {
    Notification::fake();

    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/users', [
            'first_name' => 'New',
            'last_name' => 'User',
            'email' => 'newuser@example.com',
            'company_id' => $acme->id,
            'role_id' => $adminRole->id,
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('email', 'newuser@example.com')
        ->assertJsonPath('first_name', 'New')
        ->assertJsonPath('last_name', 'User')
        ->assertJsonPath('name', 'New User');

    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->not->toBeNull();
    Notification::assertSentTo($user, WelcomeUserNotification::class);
});

test('superadmin can create user with password and no invite', function (): void {
    Notification::fake();

    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $superadmin = User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);

    $response = $this->actingAs($superadmin, 'sanctum')
        ->postJson('/api/v1/users', [
            'first_name' => 'Test',
            'last_name' => 'Account',
            'email' => 'testaccount@example.com',
            'company_id' => $acme->id,
            'role_id' => $adminRole->id,
            'use_invite' => false,
            'password' => 'password123',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('email', 'testaccount@example.com')
        ->assertJsonPath('first_name', 'Test')
        ->assertJsonPath('last_name', 'Account');

    $user = User::where('email', 'testaccount@example.com')->first();
    expect($user)->not->toBeNull();
    expect(Hash::check('password123', $user->password))->toBeTrue();
    expect($user->email_verified_at)->not->toBeNull();
    Notification::assertNothingSent();
});

test('company admin cannot create user with use_invite false', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/users', [
            'first_name' => 'Test',
            'last_name' => 'Account',
            'email' => 'forbidden@example.com',
            'company_id' => $acme->id,
            'role_id' => $adminRole->id,
            'use_invite' => false,
            'password' => 'password123',
        ]);

    $response->assertStatus(403);
    expect(User::where('email', 'forbidden@example.com')->first())->toBeNull();
});

test('resend invite works when password is null', function (): void {
    Notification::fake();

    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);
    $invitedUser = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'password' => null,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/users/{$invitedUser->id}/resend-invite");

    $response->assertStatus(200)
        ->assertJson(['message' => 'Invite email resent successfully.']);
    Notification::assertSentTo($invitedUser, WelcomeUserNotification::class);
});

test('resend invite fails when user has already logged in', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);
    $userWhoLoggedIn = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'password' => null,
        'is_active' => true,
        'last_login_at' => now(),
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/users/{$userWhoLoggedIn->id}/resend-invite");

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'This user has already logged in. Resend invite is only for users who have never logged in.']);
});

test('resend invite fails when password is set', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);
    $userWithPassword = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'password' => bcrypt('secret'),
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/users/{$userWithPassword->id}/resend-invite");

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'This user has already set their password. No invite needed.']);
});

test('cannot delete superadmin account', function (): void {
    $superadmin = User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/users/{$superadmin->id}");

    $response->assertStatus(403)
        ->assertJson(['message' => 'Superadmin accounts cannot be deleted.']);
    expect(User::find($superadmin->id))->not->toBeNull();
});

test('cannot delete own account', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/users/{$admin->id}");

    $response->assertStatus(403)
        ->assertJson(['message' => 'You cannot delete your own account.']);
});

test('cannot disable own account', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/users/{$admin->id}/disable");

    $response->assertStatus(403)
        ->assertJson(['message' => 'You cannot disable your own account.']);
});

test('admin can disable user', function (): void {
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);
    $target = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/users/{$target->id}/disable");

    $response->assertStatus(200)
        ->assertJsonPath('user.is_active', false)
        ->assertJsonFragment(['message' => 'User disabled successfully.']);

    $target->refresh();
    expect($target->is_active)->toBeFalse();
});

test('superadmin cannot be disabled', function (): void {
    $superadmin = User::factory()->create([
        'company_id' => null,
        'role_id' => null,
        'is_superadmin' => true,
    ]);
    $acme = Company::where('code', 'ACME')->first();
    $adminRole = \App\Models\Role::where('name', 'Admin')->first();
    $admin = User::factory()->create([
        'company_id' => $acme->id,
        'role_id' => $adminRole->id,
        'is_superadmin' => false,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/users/{$superadmin->id}/disable");

    $response->assertStatus(403)
        ->assertJson(['message' => 'Superadmin accounts cannot be disabled.']);
});
