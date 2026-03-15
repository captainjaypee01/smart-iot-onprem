<?php

// database/seeders/UserSeeder.php
// Seeds test users for local development.
//
// Accounts created:
//   superadmin@iot.local   password  — SuperAdmin (no company, no role)
//   admin@acme.local       password  — Admin role @ Acme Corporation
//   operator@acme.local    password  — Operator role @ Acme Corporation
//   viewer@globex.local    password  — Viewer role @ Globex Industries

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    private const PASSWORD = 'password';

    public function run(): void
    {
        $acme = Company::where('code', 'ACME')->firstOrFail();
        $globex = Company::where('code', 'GLOBEX')->firstOrFail();

        $adminRole = Role::where('name', 'Admin')->firstOrFail();
        $operatorRole = Role::where('name', 'Operator')->firstOrFail();
        $viewerRole = Role::where('name', 'Viewer')->firstOrFail();

        // ── 1. SuperAdmin ─────────────────────────────────────────────────────
        // No company, no role. is_superadmin bypasses all permission checks.
        User::firstOrCreate(
            ['email' => 'superadmin@iot.local'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'middle_name' => null,
                'name' => 'Super Admin',
                'company_id' => null,
                'role_id' => null,
                'password' => Hash::make(self::PASSWORD),
                'is_superadmin' => true,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // ── 2. Admin — Acme ───────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@acme.local'],
            [
                'first_name' => 'Alice',
                'last_name' => 'Admin',
                'middle_name' => null,
                'name' => 'Alice Admin',
                'company_id' => $acme->id,
                'role_id' => $adminRole->id,
                'password' => Hash::make(self::PASSWORD),
                'is_superadmin' => false,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // ── 3. Operator — Acme ────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'operator@acme.local'],
            [
                'first_name' => 'Bob',
                'last_name' => 'Operator',
                'middle_name' => null,
                'name' => 'Bob Operator',
                'company_id' => $acme->id,
                'role_id' => $operatorRole->id,
                'password' => Hash::make(self::PASSWORD),
                'is_superadmin' => false,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // ── 4. Viewer — Globex ────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'viewer@globex.local'],
            [
                'first_name' => 'Carol',
                'last_name' => 'Viewer',
                'middle_name' => null,
                'name' => 'Carol Viewer',
                'company_id' => $globex->id,
                'role_id' => $viewerRole->id,
                'password' => Hash::make(self::PASSWORD),
                'is_superadmin' => false,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->newLine();
        $this->command->table(
            ['Email', 'Role', 'Company', 'Password'],
            [
                ['superadmin@iot.local', 'SuperAdmin (flag)', '—',      self::PASSWORD],
                ['admin@acme.local',     'Admin',             'ACME',   self::PASSWORD],
                ['operator@acme.local',  'Operator',          'ACME',   self::PASSWORD],
                ['viewer@globex.local',  'Viewer',            'GLOBEX', self::PASSWORD],
            ]
        );
    }
}
