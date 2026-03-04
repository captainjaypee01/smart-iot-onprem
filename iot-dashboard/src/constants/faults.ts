// src/constants/faults.ts
// Fault types, severity levels, and display config for all IoT fault definitions

// ─── Fault Type IDs ───────────────────────────────────────────────
export const FAULT_TYPE = {
    // Fire Extinguisher faults
    LEAK: "LEAK",
    BLOCKED: "BLOCKED",
    MISSING: "MISSING",
    FOREIGN_OBJECT: "FOREIGN_OBJECT",
    HIGH_TEMPERATURE: "HIGH_TEMPERATURE",
    LOW_TEMPERATURE: "LOW_TEMPERATURE",
    HIGH_HUMIDITY: "HIGH_HUMIDITY",
    LOW_HUMIDITY: "LOW_HUMIDITY",
    // FE Gauge faults
    LOW_PRESSURE: "LOW_PRESSURE",
    SAFETY_PIN_ISSUE: "SAFETY_PIN_ISSUE",
} as const;

export type FaultType = typeof FAULT_TYPE[keyof typeof FAULT_TYPE];

// ─── Fault Severity ───────────────────────────────────────────────
export const FAULT_SEVERITY = {
    CRITICAL: "CRITICAL",
    WARNING: "WARNING",
    INFO: "INFO",
} as const;

export type FaultSeverity = typeof FAULT_SEVERITY[keyof typeof FAULT_SEVERITY];

// ─── Fault Display Config ─────────────────────────────────────────
// Single source of truth for label, severity, and badge color per fault type

export interface FaultMeta {
    label: string;
    severity: FaultSeverity;
    colorClass: string;   // Tailwind bg utility for badges/pills
    textClass: string;   // Tailwind text utility
    description: string;
}

export const FAULT_META: Record<FaultType, FaultMeta> = {
    [FAULT_TYPE.LEAK]: {
        label: "Leak",
        severity: FAULT_SEVERITY.CRITICAL,
        colorClass: "bg-red-100 dark:bg-red-900/30",
        textClass: "text-red-700 dark:text-red-400",
        description: "FE cylinder has a detected gas or pressure leak.",
    },
    [FAULT_TYPE.BLOCKED]: {
        label: "Blocked",
        severity: FAULT_SEVERITY.CRITICAL,
        colorClass: "bg-red-100 dark:bg-red-900/30",
        textClass: "text-red-700 dark:text-red-400",
        description: "FE nozzle or access path is obstructed.",
    },
    [FAULT_TYPE.MISSING]: {
        label: "Missing",
        severity: FAULT_SEVERITY.CRITICAL,
        colorClass: "bg-orange-100 dark:bg-orange-900/30",
        textClass: "text-orange-700 dark:text-orange-400",
        description: "FE unit has been removed from its mounting point.",
    },
    [FAULT_TYPE.FOREIGN_OBJECT]: {
        label: "Foreign Object",
        severity: FAULT_SEVERITY.WARNING,
        colorClass: "bg-yellow-100 dark:bg-yellow-900/30",
        textClass: "text-yellow-700 dark:text-yellow-400",
        description: "An unrecognised object is detected near the FE sensor.",
    },
    [FAULT_TYPE.HIGH_TEMPERATURE]: {
        label: "High Temperature",
        severity: FAULT_SEVERITY.WARNING,
        colorClass: "bg-orange-100 dark:bg-orange-900/30",
        textClass: "text-orange-700 dark:text-orange-400",
        description: "Ambient temperature exceeds the defined upper threshold.",
    },
    [FAULT_TYPE.LOW_TEMPERATURE]: {
        label: "Low Temperature",
        severity: FAULT_SEVERITY.WARNING,
        colorClass: "bg-blue-100 dark:bg-blue-900/30",
        textClass: "text-blue-700 dark:text-blue-400",
        description: "Ambient temperature is below the defined lower threshold.",
    },
    [FAULT_TYPE.HIGH_HUMIDITY]: {
        label: "High Humidity",
        severity: FAULT_SEVERITY.WARNING,
        colorClass: "bg-cyan-100 dark:bg-cyan-900/30",
        textClass: "text-cyan-700 dark:text-cyan-400",
        description: "Ambient humidity exceeds the defined upper threshold.",
    },
    [FAULT_TYPE.LOW_HUMIDITY]: {
        label: "Low Humidity",
        severity: FAULT_SEVERITY.INFO,
        colorClass: "bg-sky-100 dark:bg-sky-900/30",
        textClass: "text-sky-700 dark:text-sky-400",
        description: "Ambient humidity is below the defined lower threshold.",
    },
    [FAULT_TYPE.LOW_PRESSURE]: {
        label: "Low Pressure",
        severity: FAULT_SEVERITY.CRITICAL,
        colorClass: "bg-red-100 dark:bg-red-900/30",
        textClass: "text-red-700 dark:text-red-400",
        description: "FE gauge pressure has dropped below the safe operating range.",
    },
    [FAULT_TYPE.SAFETY_PIN_ISSUE]: {
        label: "Safety Pin Issue",
        severity: FAULT_SEVERITY.WARNING,
        colorClass: "bg-yellow-100 dark:bg-yellow-900/30",
        textClass: "text-yellow-700 dark:text-yellow-400",
        description: "Safety pin is missing or has been tampered with.",
    },
};

// ─── Fault Table Column Labels ────────────────────────────────────
export const FAULT_TABLE_COLUMNS = {
    NODE_NAME: "Node Name",
    FAULT_DESCRIPTION: "Fault Description",
    FAULT_DATETIME: "Fault Date & Time",
    LOCATION: "Location",
} as const;

// ─── Fault Status ─────────────────────────────────────────────────
export const FAULT_STATUS = {
    OUTSTANDING: "OUTSTANDING",
    RESOLVED: "RESOLVED",
} as const;

export type FaultStatus = typeof FAULT_STATUS[keyof typeof FAULT_STATUS];

export const FAULT_STATUS_LABEL: Record<FaultStatus, string> = {
    [FAULT_STATUS.OUTSTANDING]: "Outstanding",
    [FAULT_STATUS.RESOLVED]: "Resolved",
};