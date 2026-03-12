<?php

// database/seeders/PermissionSeeder.php
// Seeds all system permissions and default system roles

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
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
            ['module' => 'company', 'key' => 'company.deactivate',     'display_name' => 'Deactivate Company'],
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

        $this->command->info('Permissions seeded: ' . count($permissions) . ' entries.');

        // ── Default System Roles ──────────────────────────────────────
        $this->seedRoles();
    }

    private function seedRoles(): void
    {
        $allPermissionIds = DB::table('permissions')->pluck('id', 'key');

        $roles = [
            [
                'name'           => 'Platform Admin',
                'description'    => 'Internal role — full access across all companies and networks',
                'is_system_role' => true,
                'permissions'    => $allPermissionIds->keys()->toArray(),
            ],
            [
                'name'           => 'Platform Support',
                'description'    => 'Internal role — read-only access across all companies and networks',
                'is_system_role' => true,
                'permissions'    => [
                    'network.view',
                    'zone.view',
                    'node.view', 'node.view_readings', 'node.view_alarms',
                    'fault.view',
                    'user.view',
                    'company.view',
                    'role.view',
                ],
            ],
            [
                'name'           => 'Company Admin',
                'description'    => 'Manages users, roles, and nodes within their own company',
                'is_system_role' => true,
                'permissions'    => [
                    'network.view',
                    'zone.view', 'zone.create', 'zone.update', 'zone.delete',
                    'zone.assign_user', 'zone.remove_user', 'zone.assign_node', 'zone.remove_node',
                    'node.view', 'node.create', 'node.update', 'node.view_readings', 'node.view_alarms',
                    'fault.view', 'fault.investigate', 'fault.verify', 'fault.resolve',
                    'user.view', 'user.create', 'user.update', 'user.deactivate',
                    'role.view', 'role.assign_user',
                    'company.view',
                ],
            ],
            [
                'name'           => 'Zone Manager',
                'description'    => 'Manages assigned zones including user and node assignments',
                'is_system_role' => true,
                'permissions'    => [
                    'network.view',
                    'zone.view', 'zone.create', 'zone.update',
                    'zone.assign_user', 'zone.remove_user',
                    'zone.assign_node', 'zone.remove_node',
                    'node.view', 'node.view_readings', 'node.view_alarms',
                    'fault.view', 'fault.investigate', 'fault.verify', 'fault.resolve',
                    'user.view',
                ],
            ],
            [
                'name'           => 'Field Technician',
                'description'    => 'Views nodes and handles fault investigation and verification',
                'is_system_role' => true,
                'permissions'    => [
                    'network.view',
                    'zone.view',
                    'node.view', 'node.view_readings', 'node.view_alarms',
                    'fault.view', 'fault.investigate', 'fault.verify',
                ],
            ],
            [
                'name'           => 'Viewer',
                'description'    => 'Read-only access to networks, nodes, and faults',
                'is_system_role' => true,
                'permissions'    => [
                    'network.view',
                    'zone.view',
                    'node.view', 'node.view_readings',
                    'fault.view',
                ],
            ],
            [
                'name'           => 'QA Tester',
                'description'    => 'Internal role — limited to test networks only',
                'is_system_role' => true,
                'permissions'    => [
                    'network.view',
                    'zone.view',
                    'node.view', 'node.view_readings', 'node.view_alarms',
                    'fault.view', 'fault.investigate', 'fault.verify',
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
                        'description'    => $roleData['description'] ?? null,
                        'is_system_role' => $roleData['is_system_role'],
                        'updated_at'     => $now,
                    ]);

                $roleId = (int) $existingId;
            } else {
                $roleId = (int) DB::table('roles')->insertGetId([
                    'name'           => $roleData['name'],
                    'description'    => $roleData['description'] ?? null,
                    'is_system_role' => $roleData['is_system_role'],
                    'created_at'     => $now,
                    'updated_at'     => $now,
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

            $this->command->info("Role seeded: {$roleData['name']} with " . $permissionIds->count() . " permissions.");
        }
    }
}
