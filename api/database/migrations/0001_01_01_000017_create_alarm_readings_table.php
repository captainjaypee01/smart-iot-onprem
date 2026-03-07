<?php

// database/migrations/0001_01_01_000017_create_alarm_readings_table.php
// Partitioned time-series table for node alarm/fault readings
// Partitioned by RANGE on received_at — one partition per month
// Same partitioning strategy as node_readings

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('
            CREATE TABLE alarm_readings (
                id              BIGSERIAL       NOT NULL,
                node_id         BIGINT          NOT NULL,
                raw_data        TEXT            NOT NULL,
                received_at     TIMESTAMP       NOT NULL,

                sensor_1_hex    VARCHAR(255),
                sensor_1_value  VARCHAR(255),
                sensor_2_hex    VARCHAR(255),
                sensor_2_value  VARCHAR(255),
                sensor_3_hex    VARCHAR(255),
                sensor_3_value  VARCHAR(255),
                sensor_4_hex    VARCHAR(255),
                sensor_4_value  VARCHAR(255),
                sensor_5_hex    VARCHAR(255),
                sensor_5_value  VARCHAR(255),
                sensor_6_hex    VARCHAR(255),
                sensor_6_value  VARCHAR(255),
                sensor_7_hex    VARCHAR(255),
                sensor_7_value  VARCHAR(255),
                sensor_8_hex    VARCHAR(255),
                sensor_8_value  VARCHAR(255),

                created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

                PRIMARY KEY (id, received_at),

                CONSTRAINT fk_alarm_readings_node
                    FOREIGN KEY (node_id)
                    REFERENCES nodes(id)
                    ON DELETE CASCADE
            ) PARTITION BY RANGE (received_at)
        ');

        // ── Create initial partitions ─────────────────────────────────────────
        $months = [
            now()->subMonths(2)->startOfMonth(),
            now()->subMonth()->startOfMonth(),
            now()->startOfMonth(),
            now()->addMonth()->startOfMonth(),
            now()->addMonths(2)->startOfMonth(),
        ];

        foreach ($months as $month) {
            $this->createPartition($month);
        }
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS alarm_readings CASCADE');
    }

    private function createPartition(Carbon $month): void
    {
        $name  = 'alarm_readings_' . $month->format('Y_m');
        $from  = $month->format('Y-m-01');
        $until = $month->copy()->addMonth()->format('Y-m-01');

        DB::statement("
            CREATE TABLE IF NOT EXISTS {$name}
            PARTITION OF alarm_readings
            FOR VALUES FROM ('{$from}') TO ('{$until}')
        ");
    }
};
