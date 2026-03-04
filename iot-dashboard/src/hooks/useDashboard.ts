// src/hooks/useDashboard.ts
// Data hooks for Dashboard Overview — KPI, faults, heatmap

import { useState, useEffect, useCallback } from "react";
import {
    getDashboardKpi,
    getModuleSummaries,
    getOutstandingFaults,
    getHeatmap,
} from "@/api/dashboard";
import {
    mockGetDashboardKpi,
    mockGetModuleSummaries,
    mockGetOutstandingFaults,
    mockGetHeatmap,
} from "@/mocks/handlers";
import { POLL_INTERVAL_NORMAL, POLL_INTERVAL_SLOW, FAULTS_PAGE_SIZE } from "@/constants";
import type { DashboardKpi, ModuleSummary, Fault, HeatmapBuilding } from "@/types/dashboard";
import type { PaginatedResponse } from "@/types";

// Single flag — reads from .env.development / .env.production
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const api = {
    getDashboardKpi: USE_MOCK ? mockGetDashboardKpi : getDashboardKpi,
    getModuleSummaries: USE_MOCK ? mockGetModuleSummaries : getModuleSummaries,
    getOutstandingFaults: USE_MOCK ? mockGetOutstandingFaults : getOutstandingFaults,
    getHeatmap: USE_MOCK ? mockGetHeatmap : getHeatmap,
};

// ─── KPI + Module Summaries ───────────────────────────────────────
export const useDashboardKpi = () => {
    const [kpi, setKpi] = useState<DashboardKpi | null>(null);
    const [modules, setModules] = useState<ModuleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            const [kpiData, modData] = await Promise.all([
                api.getDashboardKpi(),
                api.getModuleSummaries(),
            ]);
            setKpi(kpiData);
            setModules(modData);
            setError(null);
        } catch {
            setError("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
        const id = setInterval(fetch, POLL_INTERVAL_NORMAL);
        return () => clearInterval(id);
    }, [fetch]);

    return { kpi, modules, loading, error, refresh: fetch };
};

// ─── Outstanding Faults (paginated) ──────────────────────────────
export const useOutstandingFaults = () => {
    const [data, setData] = useState<PaginatedResponse<Fault> | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await api.getOutstandingFaults(p, FAULTS_PAGE_SIZE);
            setData(res);
            setError(null);
        } catch {
            setError("Failed to load faults.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetch(page); }, [page]);

    useEffect(() => {
        const id = setInterval(() => fetch(page), POLL_INTERVAL_NORMAL);
        return () => clearInterval(id);
    }, [fetch, page]);

    return {
        faults: data?.data ?? [],
        meta: data?.meta,
        page,
        setPage,
        loading,
        error,
        refresh: () => fetch(page),
    };
};

// ─── Heatmap ──────────────────────────────────────────────────────
export const useHeatmap = () => {
    const [data, setData] = useState<TempBuilding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            const res = await api.getHeatmap();
            setData(res);
            setError(null);
        } catch {
            setError("Failed to load heatmap.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
        const id = setInterval(fetch, POLL_INTERVAL_SLOW);
        return () => clearInterval(id);
    }, [fetch]);

    return { data, loading, error, refresh: fetch };
};