// src/api/companies.ts
// API for companies list (dropdown for user create). GET /api/v1/companies/options

import axiosClient from "./axiosClient";
import type { CompanyOption } from "./settings";

export const getCompanyOptions = async (): Promise<CompanyOption[]> => {
    const res = await axiosClient.get<{ data: CompanyOption[] }>("/v1/companies/options");
    const data = res.data?.data ?? (res.data as unknown as CompanyOption[]);
    return Array.isArray(data) ? data : [];
};

