// src/api/permissions.ts
// API client for permission module endpoints (list, grouped view, CRUD).

import axiosClient from "./axiosClient";
import type {
    Permission,
    PermissionOption,
    PermissionsGroupedResponse,
} from "@/types/permission";

export const getPermissionsGrouped = async (): Promise<PermissionsGroupedResponse> => {
    const res = await axiosClient.get<PermissionsGroupedResponse>("/permissions");
    return res.data;
};

export const getPermissionsPaginated = async (params: {
    page?: number;
    per_page?: number;
}): Promise<{ data: Permission[]; meta: any; links: any }> => {
    const res = await axiosClient.get("/v1/permissions", {
        params: { flat: 1, ...params },
    });
    return res.data;
};

export const getPermissionOptions = async (): Promise<{ data: PermissionOption[] }> => {
    const res = await axiosClient.get<{ data: PermissionOption[] }>("/v1/permissions/options");
    return res.data;
};

export const getPermission = async (id: number): Promise<{ data: Permission }> => {
    const res = await axiosClient.get<{ data: Permission }>(`/v1/permissions/${id}`);
    return res.data;
};

export const createPermission = async (payload: {
    key: string;
    display_name: string;
    module: string;
    description?: string;
}): Promise<{ data: Permission }> => {
    const res = await axiosClient.post<{ data: Permission }>("/v1/permissions", payload);
    return res.data;
};

export const updatePermission = async (
    id: number,
    payload: { display_name?: string; description?: string },
): Promise<{ data: Permission }> => {
    const res = await axiosClient.put<{ data: Permission }>(`/v1/permissions/${id}`, payload);
    return res.data;
};

export const deletePermission = async (id: number): Promise<void> => {
    await axiosClient.delete(`/v1/permissions/${id}`);
};

