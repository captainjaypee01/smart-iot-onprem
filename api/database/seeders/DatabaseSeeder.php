<?php

// database/seeders/DatabaseSeeder.php
// Orchestrates all seeders in the correct dependency order.
// Run with: php artisan db:seed

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $this->call([
            CompanySeeder::class,       // 1. Companies first — users + networks FK to companies
            FeatureSeeder::class,       // 2. Features — system-role pivots depend on it
            PermissionSeeder::class,    // 3. Permissions before roles
            RoleSeeder::class,          // 4. Roles + role_permissions + role_companies
            NodeTypeSeeder::class,      // 5. Node types — networks pivot depends on it
            NetworkSeeder::class,       // 6. Networks + node-type pivots + company/role assignments
            UserSeeder::class,          // 7. Users + user_roles (roles must exist first)
            NodeSeeder::class,          // 8. Demo nodes for node decommission simulation
        ]);
    }
}
