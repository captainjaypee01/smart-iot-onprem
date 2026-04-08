<?php

declare(strict_types=1);

// database/seeders/PermissionSeeder.php
// Seeds all system permissions and default system roles

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PermissionSeeder extends Seeder
{
    /**
     * Permission keys for tenant company administrators (Alice Admin, etc.).
     * Must stay aligned with the seeded "Company Admin" system role below.
     * Excludes platform / superadmin-only modules: gateways, command console,
     * companies CRUD, networks CRUD, permissions, features, provisioning, etc.
     *
     * @return list<string>
     */
    public static function tenantCompanyAdminPermissionKeys(): array
    {
        return [
            'network.view',
            'zone.view',
            'zone.create',
            'zone.update',
            'zone.delete',
            'zone.assign_user',
            'zone.remove_user',
            'zone.assign_node',
            'zone.remove_node',
            'node.view',
            'node.create',
            'node.update',
            'node.view_readings',
            'node.view_alarms',
            'fault.view',
            'fault.investigate',
            'fault.verify',
            'fault.resolve',
            'user.view',
            'user.create',
            'user.update',
            'user.delete',
            'user.disable',
            'user.resend_invite',
            'user.change_status',
            'user.change_company',
            'role.view',
            'role.assign_user',
            'company.view',
        ];
    }

    public function run(): void
    {
        $permissions = [
            // ── Network ──────────────────────────────────────────────
            ['module' => 'network', 'key' => 'network.view',           'display_name' => 'View Networks'],
            ['module' => 'network', 'key' => 'network.create',         'display_name' => 'Create Network'],
            ['module' => 'network', 'key' => 'network.update',         'display_name' => 'Update Network'],
            ['module' => 'network', 'key' => 'network.delete',         'display_name' => 'Delete Network'],

            // ── Zone ─────────────────────────────────────────────────
            ['module' => 'zone', 'key' => 'zone.view',                 'display_name' => 'View Zones'],
            ['module' => 'zone', 'key' => 'zone.create',               'display_name' => 'Create Zone'],
            ['module' => 'zone', 'key' => 'zone.update',               'display_name' => 'Update Zone'],
            ['module' => 'zone', 'key' => 'zone.delete',               'display_name' => 'Delete Zone'],
            ['module' => 'zone', 'key' => 'zone.assign_user',          'display_name' => 'Assign User to Zone'],
            ['module' => 'zone', 'key' => 'zone.remove_user',          'display_name' => 'Remove User from Zone'],
            ['module' => 'zone', 'key' => 'zone.assign_node',          'display_name' => 'Assign Node to Zone'],
            ['module' => 'zone', 'key' => 'zone.remove_node',          'display_name' => 'Remove Node from Zone'],

            // ── Node ─────────────────────────────────────────────────
            ['module' => 'node', 'key' => 'node.view',                 'display_name' => 'View Nodes'],
            ['module' => 'node', 'key' => 'node.create',               'display_name' => 'Create Node'],
            ['module' => 'node', 'key' => 'node.update',               'display_name' => 'Update Node'],
            ['module' => 'node', 'key' => 'node.delete',               'display_name' => 'Delete Node'],
            ['module' => 'node', 'key' => 'node.view_readings',        'display_name' => 'View Node Readings'],
            ['module' => 'node', 'key' => 'node.view_alarms',          'display_name' => 'View Node Alarms'],

            // ── Fault ─────────────────────────────────────────────────
            ['module' => 'fault', 'key' => 'fault.view',               'display_name' => 'View Faults'],
            ['module' => 'fault', 'key' => 'fault.investigate',        'display_name' => 'Investigate Fault'],
            ['module' => 'fault', 'key' => 'fault.verify',             'display_name' => 'Verify Fault'],
            ['module' => 'fault', 'key' => 'fault.resolve',            'display_name' => 'Resolve Fault'],

            // ── User ──────────────────────────────────────────────────
            ['module' => 'user', 'key' => 'user.view',                 'display_name' => 'View Users'],
            ['module' => 'user', 'key' => 'user.create',               'display_name' => 'Create User'],
            ['module' => 'user', 'key' => 'user.update',               'display_name' => 'Update User'],
            ['module' => 'user', 'key' => 'user.delete',               'display_name' => 'Delete User'],
            ['module' => 'user', 'key' => 'user.disable',              'display_name' => 'Disable/Enable User'],
            ['module' => 'user', 'key' => 'user.resend_invite',         'display_name' => 'Resend Invite'],
            ['module' => 'user', 'key' => 'user.change_status',        'display_name' => 'Change User Status'],
            ['module' => 'user', 'key' => 'user.change_company',        'display_name' => 'Change User Company'],
            ['module' => 'user', 'key' => 'user.deactivate',           'display_name' => 'Deactivate User'],

            // ── Role ──────────────────────────────────────────────────
            ['module' => 'role', 'key' => 'role.view',                 'display_name' => 'View Roles'],
            ['module' => 'role', 'key' => 'role.create',               'display_name' => 'Create Role'],
            ['module' => 'role', 'key' => 'role.update',               'display_name' => 'Update Role'],
            ['module' => 'role', 'key' => 'role.delete',               'display_name' => 'Delete Role'],
            ['module' => 'role', 'key' => 'role.assign_user',          'display_name' => 'Assign Role to User'],

            // ── Company ───────────────────────────────────────────────
            ['module' => 'company', 'key' => 'company.view',           'display_name' => 'View Companies'],
            ['module' => 'company', 'key' => 'company.create',         'display_name' => 'Create Company'],
            ['module' => 'company', 'key' => 'company.update',         'display_name' => 'Update Company'],
            ['module' => 'company', 'key' => 'company.delete',         'display_name' => 'Delete Company'],
            ['module' => 'company', 'key' => 'company.upload_logo',    'display_name' => 'Upload Company Logo'],

            // ── Permission ───────────────────────────────────────────
            ['module' => 'permission', 'key' => 'permission.view',   'display_name' => 'View Permissions'],
            ['module' => 'permission', 'key' => 'permission.create', 'display_name' => 'Create Permission'],
            ['module' => 'permission', 'key' => 'permission.update', 'display_name' => 'Update Permission'],
            ['module' => 'permission', 'key' => 'permission.delete', 'display_name' => 'Delete Permission'],

            // ── Feature ─────────────────────────────────────────────
            ['module' => 'feature', 'key' => 'feature.view',   'display_name' => 'View Features'],
            ['module' => 'feature', 'key' => 'feature.update', 'display_name' => 'Update Feature'],
            ['module' => 'feature', 'key' => 'feature.create', 'display_name' => 'Create Feature'],
            ['module' => 'feature', 'key' => 'feature.delete', 'display_name' => 'Delete Feature'],

            // ── Provisioning ────────────────────────────────────────────
            ['module' => 'provisioning', 'key' => 'provisioning.view',   'display_name' => 'View Provisioning'],
            ['module' => 'provisioning', 'key' => 'provisioning.create', 'display_name' => 'Create Provisioning Batch'],
            ['module' => 'provisioning', 'key' => 'provisioning.resend', 'display_name' => 'Resend Provisioning Command'],

            // ── Command Console ──────────────────────────────────────────
            ['module' => 'command', 'key' => 'command.view',   'display_name' => 'View Commands'],
            ['module' => 'command', 'key' => 'command.create', 'display_name' => 'Send Command'],

            // ── Gateway ──────────────────────────────────────────────────────
            ['module' => 'gateway', 'key' => 'gateway.view',         'display_name' => 'View Gateways'],
            ['module' => 'gateway', 'key' => 'gateway.create',       'display_name' => 'Create Gateway'],
            ['module' => 'gateway', 'key' => 'gateway.update',       'display_name' => 'Update Gateway'],
            ['module' => 'gateway', 'key' => 'gateway.delete',       'display_name' => 'Delete Gateway'],
            ['module' => 'gateway', 'key' => 'gateway.send_command', 'display_name' => 'Send Gateway Command'],

            // ── Node Decommission ─────────────────────────────────────────────
            ['module' => 'node_decommission', 'key' => 'node_decommission.view',                'display_name' => 'View Node Decommission'],
            ['module' => 'node_decommission', 'key' => 'node_decommission.decommission',        'display_name' => 'Send Decommission Command'],
            ['module' => 'node_decommission', 'key' => 'node_decommission.verify',              'display_name' => 'Send Verification Command'],
            ['module' => 'node_decommission', 'key' => 'node_decommission.manual_decommission', 'display_name' => 'Manual Decommission Node'],
        ];

        foreach ($permissions as &$p) {
            $p['created_at'] = now();
            $p['updated_at'] = now();
        }

        DB::table('permissions')->upsert(
            $permissions,
            ['key'],
            ['display_name', 'module', 'updated_at']
        );

        $this->command->info('Permissions seeded: '.count($permissions).' entries.');

        // ── Default System Roles ──────────────────────────────────────
        $this->seedRoles();

        // Platform Admin (internal) gets all features + all networks.
        // Tenant "Admin" is created in RoleSeeder — its pivots are seeded there.
        self::seedRoleFeatureAndNetworkPivotsForRole('Platform Admin', false);
    }

    private function seedRoles(): void
    {
        $allPermissionIds = DB::table('permissions')->pluck('id', 'key');

        $roles = [
            [
                'name' => 'Platform Admin',
                'description' => 'Internal role — full access across all companies and networks',
                'is_system_role' => true,
                'permissions' => $allPermissionIds->keys()->toArray(),
            ],
            [
                'name' => 'Platform Support',
                'description' => 'Internal role — read-only access across all companies and networks',
                'is_system_role' => true,
                'permissions' => [
                    'network.view',
                    'zone.view',
                    'node.view',
                    'node.view_readings',
                    'node.view_alarms',
                    'fault.view',
                    'user.view',
                    'company.view',
                    'role.view',
                    'command.view',
                    'gateway.view',
                ],
            ],
            [
                'name' => 'Company Admin',
                'description' => 'Manages users, roles, and nodes within their own company',
                'is_system_role' => true,
                'permissions' => self::tenantCompanyAdminPermissionKeys(),
            ],
            [
                'name' => 'Zone Manager',
                'description' => 'Manages assigned zones including user and node assignments',
                'is_system_role' => true,
                'permissions' => [
                    'network.view',
                    'zone.view',
                    'zone.create',
                    'zone.update',
                    'zone.assign_user',
                    'zone.remove_user',
                    'zone.assign_node',
                    'zone.remove_node',
                    'node.view',
                    'node.view_readings',
                    'node.view_alarms',
                    'fault.view',
                    'fault.investigate',
                    'fault.verify',
                    'fault.resolve',
                    'user.view',
                ],
            ],
            [
                'name' => 'Field Technician',
                'description' => 'Views nodes and handles fault investigation and verification',
                'is_system_role' => true,
                'permissions' => [
                    'network.view',
                    'zone.view',
                    'node.view',
                    'node.view_readings',
                    'node.view_alarms',
                    'fault.view',
                    'fault.investigate',
                    'fault.verify',
                ],
            ],
            [
                'name' => 'Viewer',
                'description' => 'Read-only access to networks, nodes, and faults',
                'is_system_role' => true,
                'permissions' => [
                    'network.view',
                    'zone.view',
                    'node.view',
                    'node.view_readings',
                    'fault.view',
                ],
            ],
            [
                'name' => 'QA Tester',
                'description' => 'Internal role — limited to test networks only',
                'is_system_role' => true,
                'permissions' => [
                    'network.view',
                    'zone.view',
                    'node.view',
                    'node.view_readings',
                    'node.view_alarms',
                    'fault.view',
                    'fault.investigate',
                    'fault.verify',
                ],
            ],
        ];

        foreach ($roles as $roleData) {
            $permissionKeys = $roleData['permissions'];
            unset($roleData['permissions']);

            $now = now();

            // Find existing role by name (no DB constraint required)
            $existingId = DB::table('roles')
                ->where('name', $roleData['name'])
                ->value('id');

            if ($existingId) {
                DB::table('roles')
                    ->where('id', $existingId)
                    ->update([
                        'description' => $roleData['description'] ?? null,
                        'is_system_role' => $roleData['is_system_role'],
                        'updated_at' => $now,
                    ]);

                $roleId = (int) $existingId;
            } else {
                $roleId = (int) DB::table('roles')->insertGetId([
                    'name' => $roleData['name'],
                    'description' => $roleData['description'] ?? null,
                    'is_system_role' => $roleData['is_system_role'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $permissionIds = collect($permissionKeys)
                ->filter(fn (string $key) => $allPermissionIds->has($key))
                ->map(fn (string $key) => (int) $allPermissionIds[$key])
                ->values();

            DB::table('role_permissions')->where('role_id', $roleId)->delete();

            if ($permissionIds->isNotEmpty()) {
                DB::table('role_permissions')->insert(
                    $permissionIds->map(fn (int $permissionId) => [
                        'role_id' => $roleId,
                        'permission_id' => $permissionId,
                    ])->all()
                );
            }

            $this->command->info("Role seeded: {$roleData['name']} with ".$permissionIds->count().' permissions.');
        }
    }

    /**
     * Replace role_features and role_networks for one role.
     *
     * @param  bool  $tenantScopedFeatures  When true, only features with group_order < 99
     *                                      (see FeatureSeeder: "admin" / superadmin sidebar group).
     *                                      Platform internal roles use false (all active features).
     */
    public static function seedRoleFeatureAndNetworkPivotsForRole(
        string $roleName,
        bool $tenantScopedFeatures,
    ): void {
        if (! Schema::hasTable('features') || ! Schema::hasTable('role_features')) {
            return;
        }

        if (! Schema::hasTable('networks') || ! Schema::hasTable('role_networks')) {
            return;
        }

        $roleId = DB::table('roles')
            ->where('name', $roleName)
            ->value('id');

        if ($roleId === null) {
            return;
        }

        $activeNetworkIds = DB::table('networks')
            ->where('is_active', true)
            ->pluck('id')
            ->all();

        $featureQuery = DB::table('features')->where('is_active', true);

        if ($tenantScopedFeatures) {
            $featureQuery->where('group_order', '<', 99);
        }

        $activeFeatureIds = $featureQuery->pluck('id')->all();

        DB::table('role_features')
            ->where('role_id', (int) $roleId)
            ->delete();

        if ($activeFeatureIds !== []) {
            DB::table('role_features')->insert(
                collect($activeFeatureIds)
                    ->map(static fn (int $featureId): array => [
                        'role_id' => (int) $roleId,
                        'feature_id' => $featureId,
                    ])
                    ->all(),
            );
        }

        DB::table('role_networks')
            ->where('role_id', (int) $roleId)
            ->delete();

        if ($activeNetworkIds !== []) {
            DB::table('role_networks')->insert(
                collect($activeNetworkIds)
                    ->map(static fn (int $networkId): array => [
                        'role_id' => (int) $roleId,
                        'network_id' => $networkId,
                    ])
                    ->all(),
            );
        }

    }
}
