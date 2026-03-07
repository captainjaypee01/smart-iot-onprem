<?php

// app/Console/Commands/ManagePartitions.php
// Runs monthly on the 1st — creates upcoming partitions and archives expired ones
// Register in routes/console.php:
//   Schedule::command('partitions:manage')->monthlyOn(1, '00:00');

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ManagePartitions extends Command
{
    protected $signature   = 'partitions:manage {--dry-run : Preview actions without executing}';
    protected $description = 'Create upcoming partitions and archive expired ones for time-series tables';

    // Tables managed by this command
    private array $tables = [
        'node_readings',
        'alarm_readings',
    ];

    // Active retention: data older than this is detached from the live table
    private int $retentionMonths = 24;

    // Archive retention: detached data older than this is permanently deleted
    private int $archiveMonths = 60; // 5 years total

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN — no changes will be made.');
        }

        foreach ($this->tables as $table) {
            $this->line('');
            $this->info("── Processing: {$table} ──────────────────────");

            $this->createUpcomingPartition($table, $dryRun);
            $this->archiveExpiredPartitions($table, $dryRun);
            $this->purgeOldArchives($table, $dryRun);
        }

        $this->line('');
        $this->info('Partition management complete.');

        return Command::SUCCESS;
    }

    // ── Step 1: Create next month's partition ─────────────────────────────────
    // Always create 1 month ahead so there is never a gap when a new month starts
    private function createUpcomingPartition(string $table, bool $dryRun): void
    {
        $month = now()->addMonth()->startOfMonth();
        $name  = $this->partitionName($table, $month);
        $from  = $month->format('Y-m-01');
        $until = $month->copy()->addMonth()->format('Y-m-01');

        $sql = "
            CREATE TABLE IF NOT EXISTS {$name}
            PARTITION OF {$table}
            FOR VALUES FROM ('{$from}') TO ('{$until}')
        ";

        if ($dryRun) {
            $this->line("  [DRY RUN] Would create partition: {$name} ({$from} → {$until})");
            return;
        }

        try {
            DB::statement($sql);
            $this->info("  Created partition: {$name} ({$from} → {$until})");
            Log::info("Partition created: {$name}");
        } catch (\Throwable $e) {
            $this->error("  Failed to create partition {$name}: {$e->getMessage()}");
            Log::error("Partition creation failed: {$name}", ['error' => $e->getMessage()]);
        }
    }

    // ── Step 2: Detach and rename partitions beyond retention period ──────────
    // Detaching removes the partition from the parent table's query scope.
    // The data still exists on disk as a standalone table named archive_{name}.
    // It can be queried directly or re-attached if needed.
    private function archiveExpiredPartitions(string $table, bool $dryRun): void
    {
        $cutoff     = now()->subMonths($this->retentionMonths)->startOfMonth();
        $partitions = $this->getAttachedPartitionsOlderThan($table, $cutoff);

        if (empty($partitions)) {
            $this->line("  No partitions to archive.");
            return;
        }

        foreach ($partitions as $partition) {
            $archiveName = 'archive_' . $partition;

            if ($dryRun) {
                $this->line("  [DRY RUN] Would archive: {$partition} → {$archiveName}");
                continue;
            }

            try {
                DB::transaction(function () use ($table, $partition, $archiveName) {
                    // Detach from parent — excluded from all future queries on $table
                    DB::statement("ALTER TABLE {$table} DETACH PARTITION {$partition}");

                    // Rename to archive_ prefix for clarity
                    DB::statement("ALTER TABLE {$partition} RENAME TO {$archiveName}");
                });

                $this->info("  Archived: {$partition} → {$archiveName}");
                Log::info("Partition archived: {$partition} → {$archiveName}");
            } catch (\Throwable $e) {
                $this->error("  Failed to archive {$partition}: {$e->getMessage()}");
                Log::error("Partition archive failed: {$partition}", ['error' => $e->getMessage()]);
            }
        }
    }

    // ── Step 3: Hard delete archives beyond the purge threshold ──────────────
    // This permanently removes data older than $archiveMonths.
    // Runs after archiving so nothing is double-processed.
    private function purgeOldArchives(string $table, bool $dryRun): void
    {
        $cutoff = now()->subMonths($this->archiveMonths)->startOfMonth();

        // Walk back 12 months from the cutoff to find old archive tables
        for ($i = 0; $i < 12; $i++) {
            $month       = $cutoff->copy()->subMonths($i);
            $archiveName = 'archive_' . $this->partitionName($table, $month);

            if (!$this->tableExists($archiveName)) {
                continue;
            }

            if ($dryRun) {
                $this->line("  [DRY RUN] Would purge archive: {$archiveName}");
                continue;
            }

            try {
                DB::statement("DROP TABLE {$archiveName}");
                $this->info("  Purged archive: {$archiveName}");
                Log::info("Archive purged: {$archiveName}");
            } catch (\Throwable $e) {
                $this->error("  Failed to purge {$archiveName}: {$e->getMessage()}");
                Log::error("Archive purge failed: {$archiveName}", ['error' => $e->getMessage()]);
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function getAttachedPartitionsOlderThan(string $table, Carbon $cutoff): array
    {
        $results = DB::select("
            SELECT child.relname AS partition_name
            FROM pg_inherits
            JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
            JOIN pg_class child  ON pg_inherits.inhrelid  = child.oid
            WHERE parent.relname = :table
        ", ['table' => $table]);

        return collect($results)
            ->pluck('partition_name')
            ->filter(function (string $name) use ($table, $cutoff) {
                // Extract the Y_m suffix from e.g. node_readings_2024_01
                $suffix = str_replace($table . '_', '', $name);

                try {
                    $date = Carbon::createFromFormat('Y_m', $suffix);
                    return $date && $date->lt($cutoff);
                } catch (\Throwable) {
                    return false;
                }
            })
            ->values()
            ->toArray();
    }

    private function tableExists(string $name): bool
    {
        $result = DB::select("
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = :name
        ", ['name' => $name]);

        return !empty($result);
    }

    private function partitionName(string $table, Carbon $month): string
    {
        return $table . '_' . $month->format('Y_m');
    }
}
