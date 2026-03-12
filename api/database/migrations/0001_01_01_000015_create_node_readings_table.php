<?php

// database/migrations/0001_01_01_000015_create_node_readings_table.php
// Partitioned time-series table for node sensor readings
// Partitioned by RANGE on received_at — one partition per month
// Postgres automatically routes queries to the correct partition(s)

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            Schema::create('node_readings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('node_id')->constrained('nodes')->cascadeOnDelete();
                $table->text('raw_data');
                $table->timestamp('received_at');

                $table->string('sensor_1_hex')->nullable();
                $table->string('sensor_1_value')->nullable();
                $table->string('sensor_2_hex')->nullable();
                $table->string('sensor_2_value')->nullable();
                $table->string('sensor_3_hex')->nullable();
                $table->string('sensor_3_value')->nullable();
                $table->string('sensor_4_hex')->nullable();
                $table->string('sensor_4_value')->nullable();
                $table->string('sensor_5_hex')->nullable();
                $table->string('sensor_5_value')->nullable();
                $table->string('sensor_6_hex')->nullable();
                $table->string('sensor_6_value')->nullable();
                $table->string('sensor_7_hex')->nullable();
                $table->string('sensor_7_value')->nullable();
                $table->string('sensor_8_hex')->nullable();
                $table->string('sensor_8_value')->nullable();

                $table->timestamp('created_at')->useCurrent();

                $table->index('received_at');
                $table->index('node_id');
            });

            return;
        }

        // Create the parent partitioned table using raw DDL
        // Laravel Schema Builder does not support declarative partitioning
        DB::statement('
            CREATE TABLE node_readings (
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

                -- received_at must be part of the primary key
                -- because Postgres requires the partition key in the PK
                PRIMARY KEY (id, received_at),

                CONSTRAINT fk_node_readings_node
                    FOREIGN KEY (node_id)
                    REFERENCES nodes(id)
                    ON DELETE CASCADE
            ) PARTITION BY RANGE (received_at)
        ');

        // ── Create initial partitions ─────────────────────────────────────────
        // Create partitions for the past 2 months, current month, and next month
        // The ManagePartitions command handles ongoing creation automatically

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
        if (DB::connection()->getDriverName() === 'sqlite') {
            Schema::dropIfExists('node_readings');

            return;
        }

        DB::statement('DROP TABLE IF EXISTS node_readings CASCADE');
    }

    private function createPartition(Carbon $month): void
    {
        $name  = 'node_readings_' . $month->format('Y_m');
        $from  = $month->format('Y-m-01');
        $until = $month->copy()->addMonth()->format('Y-m-01');

        DB::statement("
            CREATE TABLE IF NOT EXISTS {$name}
            PARTITION OF node_readings
            FOR VALUES FROM ('{$from}') TO ('{$until}')
        ");
    }
};
