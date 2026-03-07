<?php

// database/migrations/0001_01_01_000019_create_faults_table.php
// Live faults table — contains all unresolved faults and recently resolved faults
// Resolved faults older than 6 months are moved to faults_history by a scheduled job
// This keeps the table small and all status-based queries fast
//
// NOTE: alarm_reading_id does NOT have a FK constraint intentionally.
// Postgres cannot enforce a FK to a partitioned table (alarm_readings) unless
// the partition key (received_at) is included in the unique constraint.
// Referential integrity is enforced at the application layer instead.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faults', function (Blueprint $table) {
            $table->id();
            $table->foreignId('node_id')
                ->constrained('nodes')
                ->cascadeOnDelete();
            // Plain reference — no FK constraint because alarm_readings is partitioned.
            // Postgres requires the partition key in any unique constraint used by a FK.
            // Application layer must validate this ID exists before inserting.
            $table->unsignedBigInteger('alarm_reading_id');
            $table->foreignId('fault_type_id')
                ->constrained('fault_types')
                ->restrictOnDelete();

            $table->text('description')
                ->comment('Generated description for this specific fault instance');

            // Lifecycle timestamps
            $table->timestamp('fault_date')
                ->comment('When the fault was first detected');
            $table->timestamp('fault_cleared_at')->nullable()
                ->comment('When the alarm condition cleared at node level');
            $table->timestamp('investigation_started_at')->nullable()
                ->comment('When a user first opened or clicked the fault');
            $table->timestamp('verified_at')->nullable()
                ->comment('When photo and findings were submitted');
            $table->timestamp('resolved_at')->nullable()
                ->comment('When the fault was marked as resolved');

            // Actors
            $table->foreignId('investigated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('resolved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Verification evidence
            $table->string('verification_image_path')->nullable()
                ->comment('Path on file storage — not stored as binary in DB');
            $table->text('verification_notes')->nullable();

            // Resolution flag — drives most dashboard queries
            $table->boolean('is_resolved')->default(false);

            $table->timestamps();

            // alarm_reading_id lookup — replaces the implicit index that a FK would create
            $table->index(
                'alarm_reading_id',
                'idx_faults_alarm_reading_id'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faults');
    }
};
