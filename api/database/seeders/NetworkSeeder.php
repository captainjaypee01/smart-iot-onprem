<?php

declare(strict_types=1);

// database/seeders/NetworkSeeder.php
// Seeds two demo networks — one per company — with node types attached.
// Also wires up:
//   company_networks  — so each company can see its assigned network
//   role_networks     — so seeded roles (Admin, Operator, Viewer) have network access
//
// Run after: CompanySeeder, NodeTypeSeeder, RoleSeeder.

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Network;
use App\Models\NodeType;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NetworkSeeder extends Seeder
{
    public function run(): void
    {
        $acme = Company::where('code', 'ACME')->firstOrFail();
        $globex = Company::where('code', 'GLOBEX')->firstOrFail();

        // ── Node types we'll attach (by area_id) ──────────────────────────────
        $fireExt = NodeType::where('area_id', '01000001')->first();
        $smoke = NodeType::where('area_id', '01000002')->first();
        $tempHumid = NodeType::where('area_id', '01000003')->first();
        $gas = NodeType::where('area_id', '01000004')->first();
        $door = NodeType::where('area_id', '01000005')->first();

        // ── Networks ──────────────────────────────────────────────────────────
        $acmeNetwork = Network::firstOrCreate(
            ['network_address' => 'A1B2C3'],
            [
                'name' => 'Acme HQ — Building A',
                'description' => 'Primary sensor network for Acme Corporation headquarters.',
                'diagnostic_interval' => 30,
                'alarm_threshold' => 5,
                'alarm_threshold_unit' => 'minutes',
                'wirepas_version' => '5.2',
                'is_active' => true,
                'is_maintenance' => false,
                'has_monthly_report' => true,
                'commissioned_date' => '2024-01-01',
            ]
        );

        $globexNetwork = Network::firstOrCreate(
            ['network_address' => 'D4E5F6'],
            [
                'name' => 'Globex — Main Floor',
                'description' => 'IoT mesh network deployed across the Globex main production floor.',
                'diagnostic_interval' => 10,
                'alarm_threshold' => 3,
                'alarm_threshold_unit' => 'minutes',
                'wirepas_version' => '5.2',
                'is_active' => true,
                'is_maintenance' => false,
                'has_monthly_report' => false,
                'commissioned_date' => '2024-06-01',
            ]
        );

        // ── Attach node types to each network ─────────────────────────────────
        // sync() without detaching — idempotent on re-seed.
        $acmeNodeTypeIds = collect([$fireExt, $smoke, $tempHumid, $gas])
            ->filter()
            ->pluck('id')
            ->all();

        $globexNodeTypeIds = collect([$smoke, $gas, $door, $tempHumid])
            ->filter()
            ->pluck('id')
            ->all();

        $acmeNetwork->nodeTypes()->sync($acmeNodeTypeIds);
        $globexNetwork->nodeTypes()->sync($globexNodeTypeIds);

        // ── company_networks — tie each network to its company ────────────────
        DB::table('company_networks')->insertOrIgnore([
            ['company_id' => $acme->id,   'network_id' => $acmeNetwork->id],
            ['company_id' => $globex->id, 'network_id' => $globexNetwork->id],
        ]);

        // ── role_networks — give seeded roles access to their company's network ─
        // Admin / Operator / Viewer roles are all company-scoped so they each
        // get access to the network that belongs to their company.
        $adminRole = Role::where('name', 'Admin')->first();
        $operatorRole = Role::where('name', 'Operator')->first();
        $viewerRole = Role::where('name', 'Viewer')->first();

        $rolePairs = [];

        // Every seeded role gets access to both networks so users can be tested
        // across companies without needing manual setup.
        foreach ([$adminRole, $operatorRole, $viewerRole] as $role) {
            if ($role === null) {
                continue;
            }

            foreach ([$acmeNetwork->id, $globexNetwork->id] as $networkId) {
                $rolePairs[] = ['role_id' => $role->id, 'network_id' => $networkId];
            }
        }

        if ($rolePairs !== []) {
            DB::table('role_networks')->insertOrIgnore($rolePairs);
        }

        $this->command->newLine();
        $this->command->table(
            ['Network', 'Address', 'Company', 'Node Types'],
            [
                [
                    $acmeNetwork->name,
                    $acmeNetwork->network_address,
                    'ACME',
                    implode(', ', collect([$fireExt, $smoke, $tempHumid, $gas])->filter()->pluck('name')->all()),
                ],
                [
                    $globexNetwork->name,
                    $globexNetwork->network_address,
                    'GLOBEX',
                    implode(', ', collect([$smoke, $gas, $door, $tempHumid])->filter()->pluck('name')->all()),
                ],
            ]
        );
    }
}
