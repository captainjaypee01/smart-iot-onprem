<?php

// database/seeders/RoleSeeder.php
// Creates the three system roles and assigns permissions to each.
//
// Role hierarchy:
//   SuperAdmin  — is_superadmin flag on User, no role row needed (bypasses all checks)
//   Admin       — full permissions on all modules (system role)
//   Operator    — read + action permissions, no user management (non-system role)

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin — full access ───────────────────────────────────────────────
        $admin = Role::firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'Full access to all features within the company.', 'is_system_role' => true]
        );

        $adminPermissions = Permission::pluck('id');
        $admin->permissions()->sync($adminPermissions);

        // ── Operator — operational access, no user/admin controls ─────────────
        $operator = Role::firstOrCreate(
            ['name' => 'Operator'],
            ['description' => 'Can manage faults, nodes, and zones. Cannot manage users.', 'is_system_role' => false]
        );

        $operatorKeys = [
            'fault.view',
            'fault.investigate',
            'fault.verify',
            'fault.resolve',
            'node.view',
            'zone.view',
            'alert.view',
            'alert.acknowledge',
            'report.view',
        ];

        $operatorPermissions = Permission::whereIn('key', $operatorKeys)->pluck('id');
        $operator->permissions()->sync($operatorPermissions);

        // ── Viewer — read-only ────────────────────────────────────────────────
        $viewer = Role::firstOrCreate(
            ['name' => 'Viewer'],
            ['description' => 'Read-only access to dashboard and reports.', 'is_system_role' => false]
        );

        $viewerKeys = ['fault.view', 'node.view', 'zone.view', 'alert.view', 'report.view'];
        $viewerPermissions = Permission::whereIn('key', $viewerKeys)->pluck('id');
        $viewer->permissions()->sync($viewerPermissions);

        // Multi-company role assignment baseline:
        // Attach seeded baseline roles to all companies so each tenant can assign
        // these shared roles to users out of the box.
        //
        // Important: only seed-managed roles are linked here. Do NOT attach every
        // role in the table, otherwise custom roles created later would be
        // unintentionally assigned to all companies on re-seed.
        //
        // Run after CompanySeeder so companies exist.
        $roleIds = [$admin->id, $operator->id, $viewer->id];
        $companyIds = Company::pluck('id')->all();
        $pairs = [];
        foreach ($roleIds as $roleId) {
            foreach ($companyIds as $companyId) {
                $pairs[] = ['role_id' => $roleId, 'company_id' => $companyId];
            }
        }
        if ($pairs !== []) {
            // `role_companies` has no timestamps and only (`role_id`, `company_id`) as a PK.
            // On Postgres, using `upsert` with empty update columns can still raise unique violations.
            // `insertOrIgnore` makes this idempotent by translating to `ON CONFLICT DO NOTHING`.
            \Illuminate\Support\Facades\DB::table('role_companies')->insertOrIgnore($pairs);
        }

        $this->command->info('  ✓ Roles seeded (Admin, Operator, Viewer).');
    }
}
