// src/api/roles.ts
// API for roles list by company (dropdown for user create/edit). GET /api/v1/roles/options?company_id={companyId}

import axiosClient from "./axiosClient";
import type { Role } from "@/types/role";

export const getRolesByCompany = async (companyId: number): Promise<Role[]> => {
    const res = await axiosClient.get<{ data: Role[] }>("/v1/roles/options", {
        params: { company_id: companyId },
    });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
};
