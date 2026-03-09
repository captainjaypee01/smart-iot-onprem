// src/types/index.ts
// Global TypeScript interfaces and types for the IoT Dashboard

// ─── Auth — re-exported from auth.ts (single source of truth) ────
export type {
    User,
    Company,
    Role,
    LoginCredentials,
    AuthResponse,
    SetPasswordPayload,
    MicrosoftRedirectResponse,
    SsoError,
    ApiError,
} from "./auth";

// ─── API ──────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

// ─── IoT Devices ──────────────────────────────────────────────────
export type DeviceStatus = "online" | "offline" | "warning" | "error";

export interface Device {
    id: string;
    name: string;
    type: string;
    status: DeviceStatus;
    location: string;
    last_seen: string;
    ip_address: string;
}

// ─── Alerts ───────────────────────────────────────────────────────
export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
    id: string;
    device_id: string;
    device_name: string;
    severity: AlertSeverity;
    message: string;
    created_at: string;
    resolved_at: string | null;
}

// ─── Theme ────────────────────────────────────────────────────────
export type Theme = "light" | "dark";