// src/api/roles.ts
// API for Role module (roles CRUD + options for dropdowns)

import axiosClient from "./axiosClient";
import { getCsrfCookie } from "./auth";
import type {
    Role,
    RoleListResponse,
    RoleOption,
    StoreRolePayload,
    UpdateRolePayload,
} from "@/types/role";

export const getRoles = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    company_id?: number;
}): Promise<RoleListResponse> => {
    const res = await axiosClient.get<RoleListResponse>("/v1/roles", { params });
    return res.data;
};

export const getRoleOptions = async (params?: {
    company_id?: number;
}): Promise<{ data: RoleOption[] }> => {
    const res = await axiosClient.get<{ data: RoleOption[] }>("/v1/roles/options", {
        params,
    });
    return res.data;
};

export const getRole = async (id: number): Promise<Role> => {
    const res = await axiosClient.get<Role>(`/v1/roles/${id}`);
    return res.data;
};

export const createRole = async (payload: StoreRolePayload): Promise<Role> => {
    await getCsrfCookie();
    const res = await axiosClient.post<Role>("/v1/roles", payload);
    return res.data;
};

export const updateRole = async (
    id: number,
    payload: UpdateRolePayload,
): Promise<Role> => {
    await getCsrfCookie();
    const res = await axiosClient.put<Role>(`/v1/roles/${id}`, payload);
    return res.data;
};

export const deleteRole = async (id: number): Promise<void> => {
    await getCsrfCookie();
    await axiosClient.delete(`/v1/roles/${id}`);
};

// Backward-compatible helper for older dropdown code paths.
export const getRolesByCompany = async (companyId: number): Promise<RoleOption[]> => {
    const res = await getRoleOptions({ company_id: companyId });
    return res.data;
};
