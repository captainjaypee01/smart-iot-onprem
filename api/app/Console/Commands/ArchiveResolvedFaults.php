<?php

// app/Console/Commands/ArchiveResolvedFaults.php
// Moves resolved faults older than 6 months from faults → faults_history
// Keeps the live faults table small so status-based dashboard queries stay fast
// Register in routes/console.php:
//   Schedule::command('faults:archive')->dailyAt('02:00');

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ArchiveResolvedFaults extends Command
{
    protected $signature   = 'faults:archive
                                {--months=6 : Archive faults resolved more than this many months ago}
                                {--chunk=500 : Number of rows to move per batch}
                                {--dry-run : Preview how many rows would be archived}';

    protected $description = 'Move resolved faults older than N months into faults_history';

    public function handle(): int
    {
        $months  = (int) $this->option('months');
        $chunk   = (int) $this->option('chunk');
        $dryRun  = $this->option('dry-run');
        $cutoff  = now()->subMonths($months);

        $this->info("Archiving faults resolved before: {$cutoff->toDateTimeString()}");

        if ($dryRun) {
            $this->warn('DRY RUN — no rows will be moved.');
            $count = DB::table('faults')
                ->where('is_resolved', true)
                ->where('resolved_at', '<', $cutoff)
                ->count();
            $this->info("Would archive {$count} fault(s).");
            return Command::SUCCESS;
        }

        $totalMoved = 0;

        do {
            // Fetch a chunk of fault IDs to archive
            $ids = DB::table('faults')
                ->where('is_resolved', true)
                ->where('resolved_at', '<', $cutoff)
                ->limit($chunk)
                ->pluck('id')
                ->toArray();

            if (empty($ids)) {
                break;
            }

            try {
                DB::transaction(function () use ($ids) {
                    // Copy rows to history table with archived_at timestamp
                    DB::statement("
                        INSERT INTO faults_history (
                            id, node_id, alarm_reading_id, fault_type_id,
                            description, fault_date, fault_cleared_at,
                            investigation_started_at, verified_at, resolved_at,
                            investigated_by, verified_by, resolved_by,
                            verification_image_path, verification_notes,
                            is_resolved, created_at, updated_at, archived_at
                        )
                        SELECT
                            id, node_id, alarm_reading_id, fault_type_id,
                            description, fault_date, fault_cleared_at,
                            investigation_started_at, verified_at, resolved_at,
                            investigated_by, verified_by, resolved_by,
                            verification_image_path, verification_notes,
                            is_resolved, created_at, updated_at, NOW()
                        FROM faults
                        WHERE id = ANY(?)
                    ", ['{' . implode(',', $ids) . '}']);

                    // Remove from live table only after successful copy
                    DB::table('faults')->whereIn('id', $ids)->delete();
                });

                $totalMoved += count($ids);
                $this->line("  Moved {$totalMoved} fault(s) so far...");
            } catch (\Throwable $e) {
                $this->error("Archive batch failed: {$e->getMessage()}");
                Log::error('ArchiveResolvedFaults failed', [
                    'error' => $e->getMessage(),
                    'ids'   => $ids,
                ]);
                return Command::FAILURE;
            }
        } while (count($ids) === $chunk); // Stop when we get a partial chunk

        $this->info("Archive complete. Total moved: {$totalMoved} fault(s).");
        Log::info('ArchiveResolvedFaults complete', ['total_moved' => $totalMoved]);

        return Command::SUCCESS;
    }
}
