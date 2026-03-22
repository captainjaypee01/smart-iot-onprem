// src/api/auth.ts
// API functions for authentication endpoints (cookie-based; no token in responses)
import axios from "axios";
import axiosClient from "./axiosClient";
import type {
    AuthResponse,
    LoginCredentials,
    MicrosoftRedirectResponse,
    SetPasswordPayload,
} from "@/types";
import { SANCTUM_CSRF_URL } from "@/constants";
import type { FeatureSummary } from "@/types/feature";
import type { NetworkSummary } from "@/types/auth";

/** Call before first state-changing request so Laravel sets the CSRF cookie. */
export const getCsrfCookie = async (): Promise<void> => {
    const url = SANCTUM_CSRF_URL.startsWith("http")
        ? SANCTUM_CSRF_URL
        : `${window.location.origin}${SANCTUM_CSRF_URL}`;
    await axios.get(url, { withCredentials: true });
};

export const login = async (
    credentials: LoginCredentials
): Promise<AuthResponse> => {
    await getCsrfCookie();
    const res = await axiosClient.post<AuthResponse>("/v1/auth/login", credentials);
    return res.data;
};

export const logout = async (): Promise<void> => {
    await getCsrfCookie();
    await axiosClient.post("/v1/auth/logout");
};

/** Response from GET /auth/me (user + permissions). */
export interface MeResponse {
    user: AuthResponse["user"];
    permissions: string[];
    features: FeatureSummary[];
    networks: NetworkSummary[];
}

export const getMe = async (): Promise<MeResponse> => {
    const res = await axiosClient.get<MeResponse>("/v1/auth/me");
    return res.data;
};

// Returns the Microsoft OAuth redirect URL for the browser to follow
export const getMicrosoftRedirectUrl = async (): Promise<MicrosoftRedirectResponse> => {
    const res = await axiosClient.get<MicrosoftRedirectResponse>("/v1/auth/microsoft/redirect");
    return res.data;
};

// Used on the /set-password page — called when a new user sets their password via invite link
export const setPassword = async (payload: SetPasswordPayload): Promise<AuthResponse> => {
    await getCsrfCookie();
    const res = await axiosClient.post<AuthResponse>("/v1/auth/set-password", payload);
    return res.data;
};