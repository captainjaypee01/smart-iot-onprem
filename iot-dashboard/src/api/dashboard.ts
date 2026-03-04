// src/api/dashboard.ts
// API functions for Dashboard Overview endpoints

import axiosClient from "./axiosClient";
import type { DashboardKpi, ModuleSummary, Fault, HeatmapBuilding } from "@/types/dashboard";
import type { PaginatedResponse } from "@/types";

export const getDashboardKpi = async (): Promise<DashboardKpi> => {
    const res = await axiosClient.get<DashboardKpi>("/dashboard/kpi");
    return res.data;
};

export const getModuleSummaries = async (): Promise<ModuleSummary[]> => {
    const res = await axiosClient.get<ModuleSummary[]>("/dashboard/modules");
    return res.data;
};

export const getOutstandingFaults = async (
    page = 1,
    perPage = 25,
    search = "",
    faultTypes: string[] = []
): Promise<PaginatedResponse<Fault>> => {
    const res = await axiosClient.get<PaginatedResponse<Fault>>(
        "/faults/outstanding",
        {
            params: {
                page,
                per_page: perPage,
                search: search || undefined,
                fault_types: faultTypes.length ? faultTypes.join(",") : undefined,
            },
        }
    );
    return res.data;
};

export const getHeatmap = async (): Promise<HeatmapBuilding[]> => {
    const res = await axiosClient.get<HeatmapBuilding[]>("/dashboard/heatmap");
    return res.data;
};