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
            CompanySeeder::class,       // 1. Companies first — users FK to companies
            FeatureSeeder::class,       // 2. Features first — system-role pivots depend on it
            PermissionSeeder::class,    // 3. Permissions before roles
            RoleSeeder::class,          // 4. Roles + role_permissions
            UserSeeder::class,          // 5. Users + user_roles
        ]);
    }
}
