<?php

// database/seeders/DevUsersSeeder.php
// Creates predictable dev/test users for superadmin + company admin + normal user

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DevUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure roles/permissions exist
        $this->call(PermissionSeeder::class);

        $now = now();

        DB::table('companies')->upsert([
            [
                'name' => 'Acme Company',
                'code' => 'ACME',
                'address' => null,
                'contact_email' => 'admin@acme.local',
                'contact_phone' => null,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['code'], ['name', 'address', 'contact_email', 'contact_phone', 'is_active', 'updated_at']);

        $companyId = (int) DB::table('companies')->where('code', 'ACME')->value('id');

        $platformAdminRoleId = (int) DB::table('roles')->where('name', 'Platform Admin')->value('id');
        $companyAdminRoleId = (int) DB::table('roles')->where('name', 'Company Admin')->value('id');
        $viewerRoleId = (int) DB::table('roles')->where('name', 'Viewer')->value('id');

        // Superadmin (owner) - company_id intentionally null
        DB::table('users')->updateOrInsert(
            ['email' => 'owner@platform.local'],
            [
                'company_id' => null,
                'name' => 'Platform Owner',
                'username' => 'owner',
                'password' => Hash::make('Password123!'),
                'is_superadmin' => true,
                'is_active' => true,
                'email_verified_at' => $now,
                'last_login_at' => null,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $ownerId = (int) DB::table('users')->where('email', 'owner@platform.local')->value('id');

        // Company admin
        DB::table('users')->updateOrInsert(
            ['email' => 'admin@acme.local'],
            [
                'company_id' => $companyId,
                'name' => 'Acme Admin',
                'username' => 'acme-admin',
                'password' => Hash::make('Password123!'),
                'is_superadmin' => false,
                'is_active' => true,
                'email_verified_at' => $now,
                'last_login_at' => null,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $adminId = (int) DB::table('users')->where('email', 'admin@acme.local')->value('id');

        // Normal user
        DB::table('users')->updateOrInsert(
            ['email' => 'user@acme.local'],
            [
                'company_id' => $companyId,
                'name' => 'Acme User',
                'username' => 'acme-user',
                'password' => Hash::make('Password123!'),
                'is_superadmin' => false,
                'is_active' => true,
                'email_verified_at' => $now,
                'last_login_at' => null,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $userId = (int) DB::table('users')->where('email', 'user@acme.local')->value('id');

        // Assign exactly one role per user (enforced by DB unique)
        $this->upsertUserRole($ownerId, $platformAdminRoleId, $ownerId, $now);
        $this->upsertUserRole($adminId, $companyAdminRoleId, $ownerId, $now);
        $this->upsertUserRole($userId, $viewerRoleId, $adminId, $now);

        // Optional scoping: bind Company Admin + Viewer roles to Acme Company
        DB::table('role_companies')->upsert([
            ['role_id' => $companyAdminRoleId, 'company_id' => $companyId],
            ['role_id' => $viewerRoleId, 'company_id' => $companyId],
        ], ['role_id', 'company_id'], []);

        $this->command?->info('Dev users created/updated: owner@platform.local, admin@acme.local, user@acme.local (password: Password123!)');
    }

    private function upsertUserRole(int $userId, int $roleId, int $assignedBy, $now): void
    {
        DB::table('users')
            ->where('id', $userId)
            ->update([
                'role_id' => $roleId,
                'updated_at' => $now,
            ]);
    }
}

