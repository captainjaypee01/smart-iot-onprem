<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Feature;

class FeatureSeeder extends Seeder
{
    public function run(): void
    {
        $standardFeatures = [
            // group_order = 1 (monitoring)
            [
                'key' => 'dashboard',
                'name' => 'Dashboard',
                'route' => '/dashboard',
                'icon' => 'LayoutDashboard',
                'sort_order' => 1,
                'group_order' => 1,
            ],
            [
                'key' => 'fire-extinguisher',
                'name' => 'Fire Extinguisher',
                'route' => '/fire-extinguisher',
                'icon' => 'FlameKindling',
                'sort_order' => 2,
                'group_order' => 1,
            ],
            [
                'key' => 'nodes',
                'name' => 'Nodes',
                'route' => '/nodes',
                'icon' => 'Cpu',
                'sort_order' => 3,
                'group_order' => 1,
            ],
            [
                'key' => 'alerts',
                'name' => 'Alerts',
                'route' => '/alerts',
                'icon' => 'BellRing',
                'sort_order' => 4,
                'group_order' => 1,
            ],

            // group_order = 2 (reports)
            [
                'key' => 'reports',
                'name' => 'Reports',
                'route' => '/reports',
                'icon' => 'FileText',
                'sort_order' => 1,
                'group_order' => 2,
            ],

            // group_order = 3 (management)
            [
                'key' => 'users',
                'name' => 'Users',
                'route' => '/users',
                'icon' => 'Users',
                'sort_order' => 1,
                'group_order' => 3,
            ],
            [
                'key' => 'roles',
                'name' => 'Roles',
                'route' => '/roles',
                'icon' => 'ShieldCheck',
                'sort_order' => 2,
                'group_order' => 99,
            ],
            [
                'key' => 'company-settings',
                'name' => 'Company Settings',
                'route' => '/settings/company',
                'icon' => 'Building2',
                'sort_order' => 3,
                'group_order' => 3,
            ],
        ];

        $superadminFeatures = [
            // group_order = 99 (admin group, superadmin-only)
            [
                'key' => 'companies',
                'name' => 'Companies',
                'route' => '/companies',
                'icon' => 'Building',
                'sort_order' => 1,
                'group_order' => 99,
            ],
            [
                'key' => 'networks',
                'name' => 'Networks',
                'route' => '/networks',
                'icon' => 'Network',
                'sort_order' => 2,
                'group_order' => 99,
            ],
            [
                'key' => 'node-types',
                'name' => 'Node Types',
                'route' => '/node-types',
                'icon' => 'Layers',
                'sort_order' => 3,
                'group_order' => 99,
            ],
            [
                'key' => 'permissions',
                'name' => 'Permissions',
                'route' => '/permissions',
                'icon' => 'Key',
                'sort_order' => 4,
                'group_order' => 99,
            ],
            [
                'key' => 'features',
                'name' => 'Features',
                'route' => '/features',
                'icon' => 'LayoutList',
                'sort_order' => 5,
                'group_order' => 99,
            ],
        ];

        $features = array_merge($standardFeatures, $superadminFeatures);

        // Legacy defaults: these routes/pages do not exist in the current frontend.
        // Keep rows for safety (FKs/pivots may reference them), but mark inactive so they
        // disappear from `/auth/me.features` (superadmin sees all active features).
        Feature::query()
            ->whereIn('key', ['zones', 'analytics'])
            ->update(['is_active' => false]);

        foreach ($features as $feature) {
            $key = $feature['key'];

            Feature::updateOrCreate(['key' => $key], [
                'name' => $feature['name'],
                'group' => $this->groupForOrder((int) $feature['group_order']),
                'group_order' => (int) $feature['group_order'],
                'route' => $feature['route'],
                'icon' => $feature['icon'],
                'sort_order' => (int) $feature['sort_order'],
                'is_active' => true,
            ]);
        }

        $this->command?->info('  ✓ Features seeded: ' . count($features) . ' entries.');
    }

    private function groupForOrder(int $groupOrder): string
    {
        return match ($groupOrder) {
            1 => 'monitoring',
            2 => 'reports',
            3 => 'management',
            99 => 'admin',
            default => 'general',
        };
    }
}

