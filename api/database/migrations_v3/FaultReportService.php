<?php

// app/Services/Reports/FaultReportService.php
// Unified fault querying across the live faults table and faults_history archive
// Callers never need to know which table the data lives in

namespace App\Services\Reports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FaultReportService
{
    // ── Yearly Report ─────────────────────────────────────────────────────────
    // Returns all faults for a given year regardless of which table they live in
    public function getYearlyFaults(int $year, ?int $nodeId = null): Collection
    {
        $from = Carbon::create($year)->startOfYear();
        $to = Carbon::create($year)->endOfYear();

        return $this->queryBothTables($from, $to, $nodeId);
    }

    // ── Date Range Report ────────────────────────────────────────────────────
    // Returns all faults in an arbitrary date range
    public function getFaultsInRange(
        Carbon $from,
        Carbon $to,
        ?int $nodeId = null
    ): Collection {
        return $this->queryBothTables($from, $to, $nodeId);
    }

    // ── Node Fault History ───────────────────────────────────────────────────
    // Full fault history for a single node — live + archived
    public function getNodeFaultHistory(int $nodeId): Collection
    {
        $live = DB::table('faults')
            ->where('node_id', $nodeId);

        $history = DB::table('faults_history')
            ->where('node_id', $nodeId);

        return $live
            ->unionAll($history)
            ->orderByDesc('fault_date')
            ->get();
    }

    // ── Outstanding Faults ───────────────────────────────────────────────────
    // Only queries the live table — resolved faults are never outstanding
    public function getOutstandingFaults(?int $nodeId = null): Collection
    {
        return DB::table('faults')
            ->where('is_resolved', false)
            ->when($nodeId, fn ($q) => $q->where('node_id', $nodeId))
            ->orderByDesc('fault_date')
            ->get();
    }

    // ── Pending Verification ─────────────────────────────────────────────────
    // Faults that have been investigated but not yet verified
    public function getPendingVerification(): Collection
    {
        return DB::table('faults')
            ->where('is_resolved', false)
            ->whereNotNull('investigation_started_at')
            ->whereNull('verified_at')
            ->orderBy('investigation_started_at')
            ->get();
    }

    // ── KPI Counts ───────────────────────────────────────────────────────────
    // Dashboard summary counts — live table only, fast
    public function getKpiCounts(?array $nodeIds = null): array
    {
        $base = DB::table('faults')
            ->when($nodeIds, fn ($q) => $q->whereIn('node_id', $nodeIds));

        return [
            'total_outstanding' => (clone $base)->where('is_resolved', false)->count(),
            'pending_investigation' => (clone $base)->where('is_resolved', false)->whereNull('investigation_started_at')->count(),
            'pending_verification' => (clone $base)->where('is_resolved', false)->whereNotNull('investigation_started_at')->whereNull('verified_at')->count(),
            'resolved_this_month' => (clone $base)->where('is_resolved', true)->where('resolved_at', '>=', now()->startOfMonth())->count(),
        ];
    }

    // ── Internal: Query Both Tables With UNION ALL ────────────────────────────
    // The core method that abstracts the two-table reality.
    // Both tables have identical schemas so UNION ALL is safe.
    private function queryBothTables(
        Carbon $from,
        Carbon $to,
        ?int $nodeId = null
    ): Collection {
        $live = DB::table('faults')
            ->whereBetween('fault_date', [$from, $to])
            ->when($nodeId, fn ($q) => $q->where('node_id', $nodeId));

        $history = DB::table('faults_history')
            ->whereBetween('fault_date', [$from, $to])
            ->when($nodeId, fn ($q) => $q->where('node_id', $nodeId));

        return $live
            ->unionAll($history)
            ->orderByDesc('fault_date')
            ->get();
    }
}
