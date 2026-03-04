// src/api/fireExtinguisher.ts
// API functions for the Fire Extinguisher module endpoints

import axiosClient from "./axiosClient";
import type { FeKpi, Fault, HeatmapBuilding } from "@/types/dashboard";
import type { PaginatedResponse } from "@/types";

export const getFeKpi = async (): Promise<FeKpi> => {
    const res = await axiosClient.get<FeKpi>("/fire-extinguisher/kpi");
    return res.data;
};

export const getFeFaults = async (
    page = 1,
    perPage = 25,
    search = ""
): Promise<PaginatedResponse<Fault>> => {
    const res = await axiosClient.get<PaginatedResponse<Fault>>(
        "/fire-extinguisher/faults",
        { params: { page, per_page: perPage, search: search || undefined } }
    );
    return res.data;
};

export const getFeHeatmap = async (): Promise<HeatmapBuilding[]> => {
    const res = await axiosClient.get<HeatmapBuilding[]>(
        "/fire-extinguisher/heatmap"
    );
    return res.data;
};