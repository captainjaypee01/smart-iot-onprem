<?php

// database/migrations/2026_01_16_073555_create_commands_table.php
// Partitioned time-series table for IoT commands.
// Partitioned by RANGE on requested_at — one partition per month.
// Postgres automatically routes queries to the correct partition(s).

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── SQLite fallback (used in tests) ───────────────────────────────────
        if (DB::connection()->getDriverName() === 'sqlite') {
            Schema::create('commands', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('request_id')->nullable();
                $table->foreignId('network_id')->constrained('networks')->restrictOnDelete();
                $table->string('type');
                $table->string('node_address', 10)->nullable();
                $table->unsignedSmallInteger('source_ep')->nullable();
                $table->unsignedSmallInteger('dest_ep')->nullable();
                $table->text('payload')->nullable();
                $table->boolean('no_packet_id')->default(false);
                $table->string('packet_id', 4)->nullable();
                $table->unsignedTinyInteger('processing_status')->default(1);
                $table->unsignedTinyInteger('message_status')->nullable();
                $table->unsignedTinyInteger('retry_count')->default(0);
                $table->timestamp('retry_at')->nullable();
                $table->string('error_code')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamp('requested_at')->useCurrent();
                $table->timestamp('dispatched_at')->nullable();
                $table->timestamp('acked_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('device_id')->nullable();
                $table->string('status')->default('pending');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('retry_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('network_id');
                $table->index('created_by');
                $table->index('processing_status');
                $table->index('message_status');
                $table->index(['type', 'processing_status']);
                $table->index('node_address');
                $table->index(['network_id', 'node_address']);
                $table->index('status');
                $table->index('requested_at');
                $table->index('created_at');
            });

            return;
        }

        // ── Postgres: declarative partitioned table (raw DDL) ─────────────────
        // Laravel Schema Builder does not support declarative partitioning,
        // so we use raw SQL. requested_at must be part of the primary key
        // because Postgres requires the partition key in the PK.
        DB::statement('
            CREATE TABLE commands (
                id                  BIGSERIAL       NOT NULL,
                request_id          BIGINT,

                network_id          BIGINT          NOT NULL,
                type                VARCHAR(255)    NOT NULL,
                node_address        VARCHAR(10),
                source_ep           SMALLINT,
                dest_ep             SMALLINT,
                payload             TEXT,
                no_packet_id        BOOLEAN         NOT NULL DEFAULT FALSE,
                packet_id           VARCHAR(4),

                processing_status   SMALLINT        NOT NULL DEFAULT 1,
                message_status      SMALLINT,
                retry_count         SMALLINT        NOT NULL DEFAULT 0,
                retry_at            TIMESTAMP,
                error_code          VARCHAR(255),
                error_message       TEXT,

                requested_at        TIMESTAMP       NOT NULL DEFAULT NOW(),
                dispatched_at       TIMESTAMP,
                acked_at            TIMESTAMP,
                completed_at        TIMESTAMP,

                -- Legacy / backward-compat (Node Provisioning)
                user_id             BIGINT,
                device_id           VARCHAR(255),
                status              VARCHAR(255)    NOT NULL DEFAULT \'pending\',

                created_by          BIGINT,
                retry_by            BIGINT,
                created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
                updated_at          TIMESTAMP,

                -- requested_at is included in the PK because Postgres requires
                -- the partition key to be part of every unique constraint / PK.
                PRIMARY KEY (id, requested_at),

                CONSTRAINT fk_commands_network
                    FOREIGN KEY (network_id) REFERENCES networks(id)
                    ON DELETE RESTRICT,

                CONSTRAINT fk_commands_user_id
                    FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE SET NULL,

                CONSTRAINT fk_commands_created_by
                    FOREIGN KEY (created_by) REFERENCES users(id)
                    ON DELETE SET NULL,

                CONSTRAINT fk_commands_retry_by
                    FOREIGN KEY (retry_by) REFERENCES users(id)
                    ON DELETE SET NULL

            ) PARTITION BY RANGE (requested_at)
        ');

        // ── Indexes ───────────────────────────────────────────────────────────
        DB::statement('CREATE INDEX idx_commands_network_id         ON commands (network_id)');
        DB::statement('CREATE INDEX idx_commands_created_by         ON commands (created_by)');
        DB::statement('CREATE INDEX idx_commands_processing_status  ON commands (processing_status)');
        DB::statement('CREATE INDEX idx_commands_message_status     ON commands (message_status)');
        DB::statement('CREATE INDEX idx_commands_type_status        ON commands (type, processing_status)');
        DB::statement('CREATE INDEX idx_commands_node_address       ON commands (node_address)');
        DB::statement('CREATE INDEX idx_commands_network_node       ON commands (network_id, node_address)');
        DB::statement('CREATE INDEX idx_commands_status             ON commands (status)');
        DB::statement('CREATE INDEX idx_commands_requested_at       ON commands (requested_at)');
        DB::statement('CREATE INDEX idx_commands_created_at         ON commands (created_at)');

        // ── Create initial partitions ─────────────────────────────────────────
        // 2 months back, current month, and 2 months ahead.
        // The ManagePartitions command handles ongoing creation automatically.
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
            Schema::dropIfExists('commands');

            return;
        }

        DB::statement('DROP TABLE IF EXISTS commands CASCADE');
    }

    private function createPartition(Carbon $month): void
    {
        $name = 'commands_'.$month->format('Y_m');
        $from = $month->format('Y-m-01');
        $until = $month->copy()->addMonth()->format('Y-m-01');

        DB::statement("
            CREATE TABLE IF NOT EXISTS {$name}
            PARTITION OF commands
            FOR VALUES FROM ('{$from}') TO ('{$until}')
        ");
    }
};
