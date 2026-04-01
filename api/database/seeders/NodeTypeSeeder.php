<?php

declare(strict_types=1);

// database/seeders/NodeTypeSeeder.php
// Seeds a handful of realistic node types for local development.
// These become available in the Node Type dropdown when creating networks.

namespace Database\Seeders;

use App\Models\NodeType;
use Illuminate\Database\Seeder;

class NodeTypeSeeder extends Seeder
{
    public function run(): void
    {
        $nodeTypes = [
            [
                'name'         => 'Fire Extinguisher',
                'area_id'      => '01000001',
                'description'  => 'Monitors pressure, weight, and tamper status of fire extinguisher units.',
                'sensor_1_name' => 'Pressure',    'sensor_1_unit' => 'bar',
                'sensor_2_name' => 'Weight',      'sensor_2_unit' => 'kg',
                'sensor_3_name' => 'Temperature', 'sensor_3_unit' => '°C',
                'sensor_4_name' => 'Tamper',      'sensor_4_unit' => null,
            ],
            [
                'name'         => 'Smoke Detector',
                'area_id'      => '01000002',
                'description'  => 'Optical smoke detector with battery and signal strength reporting.',
                'sensor_1_name' => 'Smoke Level', 'sensor_1_unit' => '%obs/m',
                'sensor_2_name' => 'Battery',     'sensor_2_unit' => '%',
                'sensor_3_name' => 'RSSI',        'sensor_3_unit' => 'dBm',
            ],
            [
                'name'         => 'Temperature & Humidity Sensor',
                'area_id'      => '01000003',
                'description'  => 'Ambient temperature and relative humidity sensor for environmental monitoring.',
                'sensor_1_name' => 'Temperature', 'sensor_1_unit' => '°C',
                'sensor_2_name' => 'Humidity',    'sensor_2_unit' => '%RH',
                'sensor_3_name' => 'Battery',     'sensor_3_unit' => '%',
            ],
            [
                'name'         => 'Gas Detector',
                'area_id'      => '01000004',
                'description'  => 'Detects combustible and toxic gas concentrations (CO, LPG, natural gas).',
                'sensor_1_name' => 'CO Level',    'sensor_1_unit' => 'ppm',
                'sensor_2_name' => 'LPG Level',   'sensor_2_unit' => 'ppm',
                'sensor_3_name' => 'Battery',     'sensor_3_unit' => '%',
                'sensor_4_name' => 'Temperature', 'sensor_4_unit' => '°C',
            ],
            [
                'name'         => 'Door / Window Sensor',
                'area_id'      => '01000005',
                'description'  => 'Magnetic contact sensor for monitoring door and window open/close state.',
                'sensor_1_name' => 'Contact State', 'sensor_1_unit' => null,
                'sensor_2_name' => 'Battery',       'sensor_2_unit' => '%',
            ],
        ];

        foreach ($nodeTypes as $data) {
            NodeType::firstOrCreate(['area_id' => $data['area_id']], $data);
        }

        $this->command->info('  ✓ Node types seeded: ' . count($nodeTypes) . ' entries.');
    }
}
