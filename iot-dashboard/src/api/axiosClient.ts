// src/api/axiosClient.ts
// Shared Axios instance — cookie-based auth; all API calls must use this, never import axios directly

import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import type { ApiError } from "@/types";
import { API_BASE_URL } from "@/constants";

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

function getCsrfTokenFromCookie(): string | null {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// ─── Request Interceptor ──────────────────────────────────────────
// Sends cookies (withCredentials) and CSRF token for state-changing methods
axiosClient.interceptors.request.use(
    (config) => {
        const method = config.method?.toUpperCase();
        if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
            const csrf = getCsrfTokenFromCookie();
            if (csrf) {
                config.headers["X-XSRF-TOKEN"] = csrf;
            }
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
            // For /auth/me, AuthBootstrap handles 401 and uses navigate() (SPA navigation).
            const isAuthAttempt =
                url.includes("/auth/login") ||
                url.includes("/auth/set-password") ||
                url.includes("/auth/me");

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