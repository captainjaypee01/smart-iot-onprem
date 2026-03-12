// src/constants/app.ts
// Global application-level constants

export const APP_NAME        = "Smart IoT Monitor" as const;
export const APP_SUBTITLE    = "On-Premise" as const;
export const APP_VERSION     = "1.0.0" as const;
export const APP_DESCRIPTION = "On-Premise IoT Monitoring Platform" as const;

// API
const normalizeApiBaseUrl = (input: string): string => {
  const base = input.trim().replace(/\/+$/, "");

  // Prefer a single canonical base for all API calls: {host}/api/v1
  if (/\/api\/v\d+$/.test(base)) return base;
  if (base.endsWith("/api")) return `${base}/v1`;
  if (base.endsWith("/v1")) return base;

  // If user provided only the host (e.g. http://localhost:8000), append /api/v1
  return `${base}/api/v1`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? "/api"
);

// Pagination
export const DEFAULT_PAGE_SIZE    = 25  as const;
export const PAGE_SIZE_OPTIONS    = [10, 25, 50, 100] as const;

// Polling intervals (ms) — used by live-data hooks
export const POLL_INTERVAL_FAST   = 10_000  as const;  // 10s  — live alerts
export const POLL_INTERVAL_NORMAL = 30_000  as const;  // 30s  — dashboard KPIs
export const POLL_INTERVAL_SLOW   = 60_000  as const;  // 60s  — reports / heatmap

// Faults table
export const FAULTS_PAGE_SIZE     = 10 as const;

// Date formats
export const DATE_FORMAT_DISPLAY  = "DD MMM YYYY" as const;
export const DATETIME_FORMAT      = "DD MMM YYYY, HH:mm:ss" as const;