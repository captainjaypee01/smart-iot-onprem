// src/api/axiosClient.ts
// Shared Axios instance — all API calls must use this, never import axios directly

import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import type { ApiError } from "@/types";
import { API_BASE_URL } from "@/constants";

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// ─── Request Interceptor ──────────────────────────────────────────
// Attaches Bearer token to every outgoing request if available
axiosClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────
// Handles 401 globally — logs out and redirects to login
axiosClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
            const url = error.config?.url ?? "";

            // Don't hard-redirect on expected auth failures (e.g. bad credentials).
            // Let the calling hook/page surface the message instead.
            const isAuthAttempt =
                url.includes("/auth/login") || url.includes("/auth/set-password");

            if (!isAuthAttempt) {
                useAuthStore.getState().logout();

                // Avoid full reload loops if we're already on the login page.
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;