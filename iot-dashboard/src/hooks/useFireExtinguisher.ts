// src/hooks/useFireExtinguisher.ts
// Data hooks for the Fire Extinguisher module

import { useState, useEffect, useCallback } from "react";
import { getFeKpi, getFeFaults, getFeHeatmap } from "@/api/fireExtinguisher";
import {
    mockGetFeKpi,
    mockGetFeFaults,
    mockGetFeHeatmap,
} from "@/mocks/handlers";
import { POLL_INTERVAL_NORMAL, POLL_INTERVAL_SLOW, FAULTS_PAGE_SIZE } from "@/constants";
import type { FeKpi, Fault } from "@/types/dashboard";
import type { TempBuilding } from "@/mocks/temperatureData";
import type { PaginatedResponse } from "@/types";

// Fire Extinguisher API not yet available — keep mock on until endpoints are ready.
const USE_MOCK = true;

const api = {
    getFeKpi: USE_MOCK ? mockGetFeKpi : getFeKpi,
    getFeFaults: USE_MOCK ? mockGetFeFaults : getFeFaults,
    getFeHeatmap: USE_MOCK ? mockGetFeHeatmap : getFeHeatmap,
};

// ─── FE KPI ───────────────────────────────────────────────────────
export const useFeKpi = () => {
    const [kpi, setKpi] = useState<FeKpi | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            const data = await api.getFeKpi();
            setKpi(data);
            setError(null);
        } catch {
            setError("Failed to load FE KPI.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
        const id = setInterval(fetch, POLL_INTERVAL_NORMAL);
        return () => clearInterval(id);
    }, [fetch]);

    return { kpi, loading, error, refresh: fetch };
};

// ─── FE Faults (paginated + search) ──────────────────────────────
export const useFeFaults = () => {
    const [data, setData] = useState<PaginatedResponse<Fault> | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [faultTypes, setFaultTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async (p: number, q: string, types: string[]) => {
        setLoading(true);
        try {
            const res = await api.getFeFaults(p, FAULTS_PAGE_SIZE, q, types);
            setData(res);
            setError(null);
        } catch {
            setError("Failed to load FE faults.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset to page 1 whenever search or fault type filter changes
    useEffect(() => {
        setPage(1);
        fetch(1, search, faultTypes);
    }, [search, faultTypes]);

    // Fetch when page changes
    useEffect(() => { fetch(page, search, faultTypes); }, [page]);

    // Auto-refresh every 30s
    useEffect(() => {
        const id = setInterval(
            () => fetch(page, search, faultTypes),
            POLL_INTERVAL_NORMAL
        );
        return () => clearInterval(id);
    }, [fetch, page, search, faultTypes]);

    return {
        faults: data?.data ?? [],
        meta: data?.meta,
        page, setPage,
        search, setSearch,
        faultTypes, setFaultTypes,
        loading,
        error,
        refresh: () => fetch(page, search, faultTypes),
    };
};

// ─── FE Heatmap ───────────────────────────────────────────────────
export const useFeHeatmap = () => {
    const [data, setData] = useState<TempBuilding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            const res = await api.getFeHeatmap();
            setData(res);
            setError(null);
        } catch {
            setError("Failed to load FE heatmap.");
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