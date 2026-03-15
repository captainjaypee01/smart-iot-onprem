<?php

// database/seeders/CompanySeeder.php
// Creates the demo companies used by seeded users.

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $companies = [
            [
                'name' => 'Acme Corporation',
                'code' => 'ACME',
                'address' => '123 Industry Road, Singapore 123456',
                'contact_email' => 'admin@acme.example',
                'contact_phone' => '+65 6000 0001',
                'is_active' => true,
            ],
            [
                'name' => 'Globex Industries',
                'code' => 'GLOBEX',
                'address' => '456 Commerce Street, Singapore 654321',
                'contact_email' => 'admin@globex.example',
                'contact_phone' => '+65 6000 0002',
                'is_active' => true,
            ],
        ];

        foreach ($companies as $data) {
            Company::firstOrCreate(['code' => $data['code']], $data);
        }

        $this->command->info('  ✓ Companies seeded.');
    }
}
