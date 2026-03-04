// src/types/dashboard.ts
// Types for the Dashboard Overview and module-level pages

import type { FaultType, FaultSeverity, FaultStatus } from "@/constants";

// ─── Dashboard KPI ────────────────────────────────────────────────
export interface DashboardKpi {
    total_nodes: number;
    online_nodes: number;
    offline_nodes: number;
    outstanding_faults: number;
}

// ─── Module Summary Card (shown on overview dashboard) ────────────
export interface ModuleSummary {
    module: string;   // MODULE constant key
    total_nodes: number;
    online_nodes: number;
    outstanding_faults: number;
}

// ─── Fault (Faults Table row) ─────────────────────────────────────
export interface Fault {
    id: string;
    node_id: string;
    node_name: string;
    fault_type: FaultType;   // this IS the description — use FAULT_META[fault_type].label to display
    severity: FaultSeverity;
    status: FaultStatus;
    fault_datetime: string;      // ISO 8601
    building: string;
    sector: string;
    location: string;      // formatted: "Building / Sector"
}

// ─── Heatmap ──────────────────────────────────────────────────────
export interface HeatmapSector {
    building: string;
    sector: string;
    total_nodes: number;
    fault_count: number;
}

export interface HeatmapBuilding {
    building: string;
    total_nodes: number;
    fault_count: number;
    sectors: HeatmapSector[];
}

// ─── Fire Extinguisher Module KPI ─────────────────────────────────
export interface FeKpi {
    total_nodes: number;
    online_nodes: number;
    offline_nodes: number;
    outstanding_faults: number;
    fault_breakdown: Record<string, number>;  // FaultType → count
}