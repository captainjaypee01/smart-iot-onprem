// src/constants/modules.ts
// System module/feature identifiers and their display metadata

// ─── Module IDs ───────────────────────────────────────────────────
export const MODULE = {
    FIRE_EXTINGUISHER: "FIRE_EXTINGUISHER",
    // Future modules — uncomment when onboarded
    // EXIT_EMERGENCY_LIGHT: "EXIT_EMERGENCY_LIGHT",
    // WATER_METER:          "WATER_METER",
} as const;

export type Module = typeof MODULE[keyof typeof MODULE];

// ─── Module Display Metadata ──────────────────────────────────────
export interface ModuleMeta {
    label: string;
    shortLabel: string;
    description: string;
    path: string;   // route path for the module dashboard
}

export const MODULE_META: Record<Module, ModuleMeta> = {
    [MODULE.FIRE_EXTINGUISHER]: {
        label: "Fire Extinguisher",
        shortLabel: "FE",
        description: "Monitor fire extinguisher nodes across all buildings and sectors.",
        path: "/fire-extinguisher",
    },
};