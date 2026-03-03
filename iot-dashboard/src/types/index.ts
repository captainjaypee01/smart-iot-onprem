// src/types/index.ts
// Global TypeScript interfaces and types for the IoT Dashboard

// ─── Auth ─────────────────────────────────────────────────────────
export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "operator" | "viewer";
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// ─── API ──────────────────────────────────────────────────────────
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

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