// src/api/networks.ts
// API functions for Network module endpoints

import axiosClient from "./axiosClient";
import type {
    Network,
    NetworkListResponse,
    NetworkOption,
    GenerateAddressResponse,
    StoreNetworkPayload,
    UpdateNetworkPayload,
    ToggleMaintenancePayload,
} from "@/types/network";

export const getNetworks = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: 0 | 1;
    is_maintenance?: 0 | 1;
}): Promise<NetworkListResponse> => {
    const res = await axiosClient.get("/v1/networks", { params });
    return res.data;
};

export const getNetworkOptions = async (): Promise<{ data: NetworkOption[] }> => {
    const res = await axiosClient.get("/v1/networks/options");
    return res.data;
};

export const getNetwork = async (id: number): Promise<{ data: Network }> => {
    const res = await axiosClient.get(`/v1/networks/${id}`);
    return res.data;
};

export const generateNetworkAddress = async (): Promise<GenerateAddressResponse> => {
    const res = await axiosClient.post("/v1/networks/generate-address");
    return res.data;
};

export const createNetwork = async (
    payload: StoreNetworkPayload,
): Promise<{ data: Network }> => {
    const res = await axiosClient.post("/v1/networks", payload);
    return res.data;
};

export const updateNetwork = async (
    id: number,
    payload: UpdateNetworkPayload,
): Promise<{ data: Network }> => {
    const res = await axiosClient.put(`/v1/networks/${id}`, payload);
    return res.data;
};

export const deleteNetwork = async (id: number): Promise<void> => {
    await axiosClient.delete(`/v1/networks/${id}`);
};

export const toggleMaintenance = async (
    id: number,
    payload: ToggleMaintenancePayload,
): Promise<{ data: Network }> => {
    const res = await axiosClient.post(`/v1/networks/${id}/toggle-maintenance`, payload);
    return res.data;
};

