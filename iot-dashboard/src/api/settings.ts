// src/api/settings.ts
// API for app settings (session duration, etc.) — per company; superadmin can pick company, company admin edits own.

import axiosClient from "./axiosClient";
import { getCsrfCookie } from "./auth";

export interface CompanyOption {
    id: number;
    name: string;
    code: string;
}

export interface SessionSettingsResponse {
    session_lifetime_minutes: string;
    effective_minutes: number;
    companies?: CompanyOption[];
    company_id?: number | null;
}

export async function getSessionSettings(
    companyId?: number | null
): Promise<SessionSettingsResponse> {
    const params =
        companyId != null ? { company_id: companyId } : undefined;
    const res = await axiosClient.get<SessionSettingsResponse>(
        "/v1/settings/session",
        { params }
    );
    return res.data;
}

export async function updateSessionSettings(payload: {
    session_lifetime_minutes: string;
    company_id?: number;
}): Promise<{
    session_lifetime_minutes: string;
    company_id?: number;
    message: string;
}> {
    await getCsrfCookie();
    const res = await axiosClient.patch<{
        session_lifetime_minutes: string;
        company_id?: number;
        message: string;
    }>("/v1/settings/session", payload);
    return res.data;
}
