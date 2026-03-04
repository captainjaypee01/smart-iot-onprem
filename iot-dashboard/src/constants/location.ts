// src/constants/location.ts
// Location hierarchy labels and heatmap display constants

// ─── Location Hierarchy Labels ────────────────────────────────────
export const LOCATION_LABEL = {
    BUILDING: "Building",
    SECTOR: "Sector",
    NODE: "Node",
} as const;

// ─── Heatmap Config ───────────────────────────────────────────────
// Fault count thresholds that determine heatmap cell color intensity.
// Adjust these thresholds based on your acceptable fault density per sector.

export const HEATMAP_THRESHOLD = {
    NONE: 0,    // 0 faults     — green  (healthy)
    LOW: 1,    // 1–4 faults   — yellow (monitor)
    MEDIUM: 5,    // 5–9 faults   — orange (attention)
    HIGH: 10,   // 10–19 faults — red    (critical)
    SEVERE: 20,   // 20+ faults   — dark red (severe)
} as const;

export const HEATMAP_COLOR = {
    NONE: { bg: "bg-green-100  dark:bg-green-900/30", text: "text-green-700  dark:text-green-400" },
    LOW: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
    MEDIUM: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
    HIGH: { bg: "bg-red-100    dark:bg-red-900/30", text: "text-red-700    dark:text-red-400" },
    SEVERE: { bg: "bg-red-200    dark:bg-red-950/60", text: "text-red-900    dark:text-red-300" },
} as const;

// Helper — returns heatmap color key based on fault count
export const getHeatmapLevel = (
    count: number
): keyof typeof HEATMAP_COLOR => {
    if (count >= HEATMAP_THRESHOLD.SEVERE) return "SEVERE";
    if (count >= HEATMAP_THRESHOLD.HIGH) return "HIGH";
    if (count >= HEATMAP_THRESHOLD.MEDIUM) return "MEDIUM";
    if (count >= HEATMAP_THRESHOLD.LOW) return "LOW";
    return "NONE";
};