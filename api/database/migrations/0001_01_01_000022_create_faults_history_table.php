<?php

// database/migrations/0001_01_01_000022_create_faults_history_table.php
// Cold archive for resolved faults older than 6 months
// Fed by the ArchiveResolvedFaults scheduled command
// Same schema as faults — allows identical query structure via UNION ALL
// Never written to directly by the application — only by the archive job

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faults_history', function (Blueprint $table) {
            // Mirrors faults table exactly — intentionally no FK constraints
            // because this is an archive store, not a live relational table.
            // Referential integrity was enforced when the row lived in faults.
            $table->id();
            $table->unsignedBigInteger('node_id');
            $table->unsignedBigInteger('alarm_reading_id');
            $table->unsignedBigInteger('fault_type_id');

            $table->text('description');

            // Lifecycle timestamps
            $table->timestamp('fault_date');
            $table->timestamp('fault_cleared_at')->nullable();
            $table->timestamp('investigation_started_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('resolved_at')->nullable();

            // Actors stored as plain IDs — no FK, user may have been deactivated
            $table->unsignedBigInteger('investigated_by')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();

            // Evidence
            $table->string('verification_image_path')->nullable();
            $table->text('verification_notes')->nullable();

            // Always true here — only resolved faults are archived
            $table->boolean('is_resolved')->default(true);

            // Original timestamps from the faults table
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            // When this row was moved to history
            $table->timestamp('archived_at')->useCurrent();

            // ── Indexes ───────────────────────────────────────────────────────

            // Primary report query: all faults for a node in a date range
            $table->index(['node_id', 'fault_date'],
                'idx_faults_history_node_date');

            // Yearly report query: all faults in a date range across nodes
            $table->index('fault_date',
                'idx_faults_history_fault_date');

            // Filter by resolved date (when was it resolved, not when it occurred)
            $table->index('resolved_at',
                'idx_faults_history_resolved_at');

            // Filter by fault type for historical analysis
            $table->index('fault_type_id',
                'idx_faults_history_fault_type_id');

            // When the record was archived (useful for archive management queries)
            $table->index('archived_at',
                'idx_faults_history_archived_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faults_history');
    }
};
