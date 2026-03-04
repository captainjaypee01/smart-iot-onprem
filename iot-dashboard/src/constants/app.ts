// src/constants/app.ts
// Global application-level constants

export const APP_NAME        = "IoT Monitor" as const;
export const APP_SUBTITLE    = "On-Premise" as const;
export const APP_VERSION     = "1.0.0" as const;
export const APP_DESCRIPTION = "On-Premise IoT Monitoring Platform" as const;

// Pagination
export const DEFAULT_PAGE_SIZE    = 25  as const;
export const PAGE_SIZE_OPTIONS    = [10, 25, 50, 100] as const;

// Polling intervals (ms) — used by live-data hooks
export const POLL_INTERVAL_FAST   = 10_000  as const;  // 10s  — live alerts
export const POLL_INTERVAL_NORMAL = 30_000  as const;  // 30s  — dashboard KPIs
export const POLL_INTERVAL_SLOW   = 60_000  as const;  // 60s  — reports / heatmap

// Date formats
export const DATE_FORMAT_DISPLAY  = "DD MMM YYYY" as const;
export const DATETIME_FORMAT      = "DD MMM YYYY, HH:mm:ss" as const;