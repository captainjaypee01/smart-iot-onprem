<?php

// routes/console.php
// Scheduled command registration for partition management and fault archiving
// Laravel 11+ uses this file for scheduling

use Illuminate\Support\Facades\Schedule;

// ── Partition Management ──────────────────────────────────────────────────────
// Runs on the 1st of every month at midnight
// Creates next month's partition for node_readings and alarm_readings
// Detaches partitions older than 24 months into archive_ tables
// Drops archive_ tables older than 60 months permanently
Schedule::command('partitions:manage')
    ->monthlyOn(1, '00:00')
    ->onOneServer()                     // Prevents duplicate runs in multi-server setups
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/partitions.log'));

// ── Fault Archiving ───────────────────────────────────────────────────────────
// Runs daily at 2am — moves resolved faults older than 6 months to faults_history
// Runs daily (not monthly) so the batch size stays small and predictable
// Adjust --months and --chunk based on your fault volume
Schedule::command('faults:archive --months=6 --chunk=500')
    ->dailyAt('02:00')
    ->onOneServer()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/faults_archive.log'));
