// src/mocks/handlers.ts
// Mock API functions that mirror the real API signatures exactly.
// Swap real API imports for mock imports by changing 1 line in each hook.

import {
    MOCK_DASHBOARD_KPI,
    MOCK_MODULE_SUMMARIES,
    MOCK_FE_KPI,
    MOCK_FAULTS,
    MOCK_HEATMAP,
    MOCK_NODES,
    paginateFaults,
} from "./data";
import { MOCK_TEMP_HEATMAP } from "./temperatureData";
import type { DashboardKpi, ModuleSummary, Fault, HeatmapBuilding, FeKpi } from "@/types/dashboard";
import type { PaginatedResponse } from "@/types";
import type { MockNode } from "./data";
import type { TempBuilding } from "./temperatureData";

// Simulates network latency (ms)
const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// ─── Dashboard ────────────────────────────────────────────────────
export const mockGetDashboardKpi = async (): Promise<DashboardKpi> => {
    await delay();
    return MOCK_DASHBOARD_KPI;
};

export const mockGetModuleSummaries = async (): Promise<ModuleSummary[]> => {
    await delay();
    return MOCK_MODULE_SUMMARIES;
};

export const mockGetOutstandingFaults = async (
    page = 1,
    perPage = 25,
    search = "",
    faultTypes: string[] = []
): Promise<PaginatedResponse<Fault>> => {
    await delay();
    return paginateFaults(MOCK_FAULTS, page, perPage, search, faultTypes);
};

export const mockGetHeatmap = async (): Promise<TempBuilding[]> => {
    await delay(600);
    return MOCK_TEMP_HEATMAP;
};

// ─── Fire Extinguisher ────────────────────────────────────────────
export const mockGetFeKpi = async (): Promise<FeKpi> => {
    await delay();
    return MOCK_FE_KPI;
};

export const mockGetFeFaults = async (
    page = 1,
    perPage = 25,
    search = "",
    faultTypes: string[] = []
): Promise<PaginatedResponse<Fault>> => {
    await delay();
    return paginateFaults(MOCK_FAULTS, page, perPage, search, faultTypes);
};

export const mockGetFeHeatmap = async (): Promise<TempBuilding[]> => {
    await delay(600);
    return MOCK_TEMP_HEATMAP;
};

// ─── Nodes ────────────────────────────────────────────────────────
export const mockGetNodes = async (
    page = 1,
    perPage = 25,
    search = ""
): Promise<PaginatedResponse<MockNode>> => {
    await delay();
    const filtered = search
        ? MOCK_NODES.filter(
            (n) =>
                n.name.toLowerCase().includes(search.toLowerCase()) ||
                n.location.toLowerCase().includes(search.toLowerCase()) ||
                n.node_type.toLowerCase().includes(search.toLowerCase())
        )
        : MOCK_NODES;

    const total = filtered.length;
    const last_page = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, last_page);
    const start = (safePage - 1) * perPage;

    return {
        data: filtered.slice(start, start + perPage),
        meta: { current_page: safePage, last_page, per_page: perPage, total },
    };
};

// ─── Auth (mock login — accepts any email/password) ───────────────
export const mockLogin = async (email: string) => {
    await delay(800);
    return {
        token: "mock-jwt-token-abc123",
        user: {
            id: "user-001",
            name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            email,
            role: "admin" as const,
        },
    };
};