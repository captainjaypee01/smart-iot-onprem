// src/mocks/data.ts
// Dummy data that mirrors real API response shapes.
// All types are imported from src/types so structure is always in sync.

import type { DashboardKpi, ModuleSummary, Fault, HeatmapBuilding, FeKpi } from "@/types/dashboard";
import type { PaginatedResponse } from "@/types";
import {
    FAULT_TYPE,
    FAULT_SEVERITY,
    FAULT_STATUS,
    MODULE,
    NODE_TYPE,
    FE_CONFIG,
} from "@/constants";

// ─── Buildings & Sectors ──────────────────────────────────────────
// Simulates a multi-building campus with sectors per floor/zone.
// Each sector can have many FE nodes (we have 10k+ in production).

export const MOCK_LOCATIONS = [
    {
        building: "Block A",
        sectors: ["A-L1-S1", "A-L1-S2", "A-L2-S1", "A-L2-S2", "A-L3-S1"],
    },
    {
        building: "Block B",
        sectors: ["B-L1-S1", "B-L1-S2", "B-L2-S1", "B-L3-S1", "B-L3-S2"],
    },
    {
        building: "Block C",
        sectors: ["C-L1-S1", "C-L2-S1", "C-L2-S2"],
    },
    {
        building: "Warehouse D",
        sectors: ["WD-Z1", "WD-Z2", "WD-Z3"],
    },
    {
        building: "Server Room E",
        sectors: ["SR-E-MAIN"],
    },
] as const;

// ─── Mock Nodes (FE) ──────────────────────────────────────────────
// Represents individual fire extinguisher IoT nodes across all buildings.

export interface MockNode {
    id: string;
    name: string;
    node_type: string;
    fe_config: string;
    building: string;
    sector: string;
    location: string;  // formatted "Building / Sector"
    status: "online" | "offline" | "warning" | "error";
    ip_address: string;
    last_seen: string;
}

const makeNode = (
    idx: number,
    building: string,
    sector: string,
    nodeType: string,
    feConfig: string,
    status: MockNode["status"]
): MockNode => ({
    id: `node-${String(idx).padStart(4, "0")}`,
    name: `FE-${String(idx).padStart(4, "0")}`,
    node_type: nodeType,
    fe_config: feConfig,
    building,
    sector,
    location: `${building} / ${sector}`,
    status,
    ip_address: `192.168.1.${(idx % 254) + 1}`,
    last_seen: new Date(Date.now() - Math.random() * 3_600_000).toISOString(),
});

// Generate 50 sample nodes spread across all buildings/sectors
export const MOCK_NODES: MockNode[] = [
    // Block A
    makeNode(1, "Block A", "A-L1-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(2, "Block A", "A-L1-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(3, "Block A", "A-L1-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "warning"),
    makeNode(4, "Block A", "A-L1-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(5, "Block A", "A-L1-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0002, "online"),
    makeNode(6, "Block A", "A-L2-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "error"),
    makeNode(7, "Block A", "A-L2-S1", NODE_TYPE.FE_GAUGE_V1_3, "", "online"),
    makeNode(8, "Block A", "A-L2-S1", NODE_TYPE.FE_GAUGE_V1_3, "", "online"),
    makeNode(9, "Block A", "A-L2-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "warning"),
    makeNode(10, "Block A", "A-L2-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0002, "online"),
    makeNode(11, "Block A", "A-L3-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(12, "Block A", "A-L3-S1", NODE_TYPE.FE_GAUGE_V1_3, "", "offline"),

    // Block B
    makeNode(13, "Block B", "B-L1-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(14, "Block B", "B-L1-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(15, "Block B", "B-L1-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0002, "warning"),
    makeNode(16, "Block B", "B-L1-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0002, "online"),
    makeNode(17, "Block B", "B-L2-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "error"),
    makeNode(18, "Block B", "B-L2-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(19, "Block B", "B-L3-S1", NODE_TYPE.FE_GAUGE_V1_3, "", "online"),
    makeNode(20, "Block B", "B-L3-S1", NODE_TYPE.FE_GAUGE_V1_3, "", "warning"),
    makeNode(21, "Block B", "B-L3-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(22, "Block B", "B-L3-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "offline"),

    // Block C
    makeNode(23, "Block C", "C-L1-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(24, "Block C", "C-L1-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0002, "online"),
    makeNode(25, "Block C", "C-L2-S1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "warning"),
    makeNode(26, "Block C", "C-L2-S1", NODE_TYPE.FE_GAUGE_V1_3, "", "online"),
    makeNode(27, "Block C", "C-L2-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(28, "Block C", "C-L2-S2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0002, "error"),

    // Warehouse D
    makeNode(29, "Warehouse D", "WD-Z1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(30, "Warehouse D", "WD-Z1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(31, "Warehouse D", "WD-Z1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "warning"),
    makeNode(32, "Warehouse D", "WD-Z1", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0002, "error"),
    makeNode(33, "Warehouse D", "WD-Z2", NODE_TYPE.FE_GAUGE_V1_3, "", "online"),
    makeNode(34, "Warehouse D", "WD-Z2", NODE_TYPE.FE_GAUGE_V1_3, "", "online"),
    makeNode(35, "Warehouse D", "WD-Z2", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "offline"),
    makeNode(36, "Warehouse D", "WD-Z3", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(37, "Warehouse D", "WD-Z3", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0002, "online"),
    makeNode(38, "Warehouse D", "WD-Z3", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "warning"),

    // Server Room E — high priority, fewer nodes
    makeNode(39, "Server Room E", "SR-E-MAIN", NODE_TYPE.FE_GAUGE_V1_3, "", "online"),
    makeNode(40, "Server Room E", "SR-E-MAIN", NODE_TYPE.FE_GAUGE_V1_3, "", "online"),
    makeNode(41, "Server Room E", "SR-E-MAIN", NODE_TYPE.FE_GAUGE_V1_3, "", "warning"),
    makeNode(42, "Server Room E", "SR-E-MAIN", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "online"),
    makeNode(43, "Server Room E", "SR-E-MAIN", NODE_TYPE.FIRE_EXTINGUISHER, FE_CONFIG.CONFIG_0001, "error"),
];

// ─── Mock Faults ──────────────────────────────────────────────────
// 20 outstanding faults derived from the nodes above.

const makeFault = (
    idx: number,
    nodeId: string,
    nodeName: string,
    faultType: string,
    severity: string,
    building: string,
    sector: string,
    hoursAgo: number
): Fault => ({
    id: `fault-${String(idx).padStart(3, "0")}`,
    node_id: nodeId,
    node_name: nodeName,
    fault_type: faultType as Fault["fault_type"],
    severity: severity as Fault["severity"],
    status: FAULT_STATUS.OUTSTANDING,
    fault_datetime: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
    building,
    sector,
    location: `${building} / ${sector}`,
});

export const MOCK_FAULTS: Fault[] = [
    makeFault(1, "node-0003", "FE-0003", FAULT_TYPE.LEAK, FAULT_SEVERITY.CRITICAL, "Block A", "A-L1-S1", 1),
    makeFault(2, "node-0006", "FE-0006", FAULT_TYPE.MISSING, FAULT_SEVERITY.CRITICAL, "Block A", "A-L2-S1", 3),
    makeFault(3, "node-0009", "FE-0009", FAULT_TYPE.HIGH_TEMPERATURE, FAULT_SEVERITY.WARNING, "Block A", "A-L2-S2", 5),
    makeFault(4, "node-0010", "FE-0010", FAULT_TYPE.HIGH_HUMIDITY, FAULT_SEVERITY.WARNING, "Block A", "A-L2-S2", 2),
    makeFault(5, "node-0012", "FE-0012", FAULT_TYPE.LOW_PRESSURE, FAULT_SEVERITY.CRITICAL, "Block A", "A-L3-S1", 8),
    makeFault(6, "node-0015", "FE-0015", FAULT_TYPE.BLOCKED, FAULT_SEVERITY.CRITICAL, "Block B", "B-L1-S2", 6),
    makeFault(7, "node-0017", "FE-0017", FAULT_TYPE.FOREIGN_OBJECT, FAULT_SEVERITY.WARNING, "Block B", "B-L2-S1", 4),
    makeFault(8, "node-0020", "FE-0020", FAULT_TYPE.HIGH_TEMPERATURE, FAULT_SEVERITY.WARNING, "Block B", "B-L3-S1", 12),
    makeFault(9, "node-0022", "FE-0022", FAULT_TYPE.MISSING, FAULT_SEVERITY.CRITICAL, "Block B", "B-L3-S2", 7),
    makeFault(10, "node-0025", "FE-0025", FAULT_TYPE.LEAK, FAULT_SEVERITY.CRITICAL, "Block C", "C-L2-S1", 2),
    makeFault(11, "node-0028", "FE-0028", FAULT_TYPE.SAFETY_PIN_ISSUE, FAULT_SEVERITY.WARNING, "Block C", "C-L2-S2", 9),
    makeFault(12, "node-0031", "FE-0031", FAULT_TYPE.HIGH_HUMIDITY, FAULT_SEVERITY.WARNING, "Warehouse D", "WD-Z1", 11),
    makeFault(13, "node-0032", "FE-0032", FAULT_TYPE.LOW_TEMPERATURE, FAULT_SEVERITY.WARNING, "Warehouse D", "WD-Z1", 15),
    makeFault(14, "node-0033", "FE-0033", FAULT_TYPE.LOW_PRESSURE, FAULT_SEVERITY.CRITICAL, "Warehouse D", "WD-Z2", 1),
    makeFault(15, "node-0035", "FE-0035", FAULT_TYPE.MISSING, FAULT_SEVERITY.CRITICAL, "Warehouse D", "WD-Z2", 20),
    makeFault(16, "node-0038", "FE-0038", FAULT_TYPE.BLOCKED, FAULT_SEVERITY.CRITICAL, "Warehouse D", "WD-Z3", 3),
    makeFault(17, "node-0041", "FE-0041", FAULT_TYPE.HIGH_TEMPERATURE, FAULT_SEVERITY.WARNING, "Server Room E", "SR-E-MAIN", 0.5),
    makeFault(18, "node-0043", "FE-0043", FAULT_TYPE.LEAK, FAULT_SEVERITY.CRITICAL, "Server Room E", "SR-E-MAIN", 1),
    makeFault(19, "node-0043", "FE-0043", FAULT_TYPE.SAFETY_PIN_ISSUE, FAULT_SEVERITY.WARNING, "Server Room E", "SR-E-MAIN", 2),
    makeFault(20, "node-0017", "FE-0017", FAULT_TYPE.LOW_HUMIDITY, FAULT_SEVERITY.INFO, "Block B", "B-L2-S1", 18),
];

// ─── Derived: Dashboard KPI ───────────────────────────────────────
export const MOCK_DASHBOARD_KPI: DashboardKpi = {
    total_nodes: MOCK_NODES.length,
    online_nodes: MOCK_NODES.filter((n) => n.status === "online").length,
    offline_nodes: MOCK_NODES.filter((n) => n.status === "offline").length,
    outstanding_faults: MOCK_FAULTS.length,
};

// ─── Derived: Module Summaries ────────────────────────────────────
export const MOCK_MODULE_SUMMARIES: ModuleSummary[] = [
    {
        module: MODULE.FIRE_EXTINGUISHER,
        total_nodes: MOCK_NODES.length,
        online_nodes: MOCK_NODES.filter((n) => n.status === "online").length,
        outstanding_faults: MOCK_FAULTS.length,
    },
];

// ─── Derived: FE KPI ──────────────────────────────────────────────
const faultBreakdown = MOCK_FAULTS.reduce<Record<string, number>>((acc, f) => {
    acc[f.fault_type] = (acc[f.fault_type] ?? 0) + 1;
    return acc;
}, {});

export const MOCK_FE_KPI: FeKpi = {
    total_nodes: MOCK_NODES.length,
    online_nodes: MOCK_NODES.filter((n) => n.status === "online").length,
    offline_nodes: MOCK_NODES.filter((n) => n.status === "offline").length,
    outstanding_faults: MOCK_FAULTS.length,
    fault_breakdown: faultBreakdown,
};

// ─── Derived: Heatmap ─────────────────────────────────────────────
// Aggregates fault counts and node counts per building > sector
export const MOCK_HEATMAP: HeatmapBuilding[] = MOCK_LOCATIONS.map(({ building, sectors }) => {
    const sectorData = sectors.map((sector) => {
        const sectorNodes = MOCK_NODES.filter((n) => n.building === building && n.sector === sector);
        const sectorFaults = MOCK_FAULTS.filter((f) => f.building === building && f.sector === sector);
        return {
            building,
            sector,
            total_nodes: sectorNodes.length,
            fault_count: sectorFaults.length,
        };
    });

    const buildingNodes = MOCK_NODES.filter((n) => n.building === building);
    const buildingFaults = MOCK_FAULTS.filter((f) => f.building === building);

    return {
        building,
        total_nodes: buildingNodes.length,
        fault_count: buildingFaults.length,
        sectors: sectorData,
    };
});

// ─── Paginated Faults Helper ──────────────────────────────────────
export const paginateFaults = (
    faults: Fault[],
    page: number,
    perPage: number,
    search = "",
    faultTypes: string[] = []
): PaginatedResponse<Fault> => {
    let filtered = faults;

    // Filter by fault types first (server-side responsibility)
    if (faultTypes.length > 0) {
        filtered = filtered.filter((f) => faultTypes.includes(f.fault_type));
    }

    // Then apply search across remaining records
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
            (f) =>
                f.node_name.toLowerCase().includes(q) ||
                f.fault_type.toLowerCase().includes(q) ||
                f.location.toLowerCase().includes(q)
        );
    }

    const total = filtered.length;
    const last_page = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, last_page);
    const start = (safePage - 1) * perPage;

    return {
        data: filtered.slice(start, start + perPage),
        meta: { current_page: safePage, last_page, per_page: perPage, total },
    };
};