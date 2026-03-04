// src/constants/nodes.ts
// Node types, sensor configs, and sensor labels for all IoT node definitions

// ─── Node Type IDs ────────────────────────────────────────────────
export const NODE_TYPE = {
    FIRE_EXTINGUISHER: "FIRE_EXTINGUISHER",
    FE_GAUGE_V1_3: "FE_GAUGE_V1_3",
    // Future node types — add here when onboarded
    // EXIT_EMERGENCY_LIGHT: "EXIT_EMERGENCY_LIGHT",
    // WATER_METER:          "WATER_METER",
} as const;

export type NodeType = typeof NODE_TYPE[keyof typeof NODE_TYPE];

// ─── Node Type Display Labels ─────────────────────────────────────
export const NODE_TYPE_LABEL: Record<NodeType, string> = {
    [NODE_TYPE.FIRE_EXTINGUISHER]: "Fire Extinguisher",
    [NODE_TYPE.FE_GAUGE_V1_3]: "FE Gauge (v1.3)",
};

// ─── Fire Extinguisher — Sensor Config IDs ────────────────────────
export const FE_CONFIG = {
    CONFIG_0001: "0001",   // FX_LOGIC  — Sensor 6 carries fault logic
    CONFIG_0002: "0002",   // FX_LOGIC_G — Sensor 7 carries gram-based fault logic
} as const;

export type FeConfig = typeof FE_CONFIG[keyof typeof FE_CONFIG];

// ─── Sensor Slot Count per Node ───────────────────────────────────
export const SENSOR_COUNT = 8 as const;   // all nodes have 8 sensor slots

// ─── Sensor Slot Indices (1-based, matching hardware) ─────────────
export const SENSOR_SLOT = {
    S1: 1,
    S2: 2,
    S3: 3,
    S4: 4,
    S5: 5,
    S6: 6,
    S7: 7,
    S8: 8,
} as const;

// ─── Sensor Labels ────────────────────────────────────────────────
// Maps each node type (and FE config) to human-readable sensor names.
// Sensor slots with no function are explicitly marked N/A.

export const SENSOR_LABELS: Record<string, Record<number, string>> = {

    // Fire Extinguisher — Config 0001
    [`${NODE_TYPE.FIRE_EXTINGUISHER}_${FE_CONFIG.CONFIG_0001}`]: {
        1: "Humidity",
        2: "Temperature",
        3: "Ultrasonic",
        4: "Missing",
        5: "N/A",
        6: "FX Logic",    // identifies: Missing | Leak | Foreign Object
        7: "N/A",
        8: "N/A",
    },

    // Fire Extinguisher — Config 0002 (Grams Logic)
    [`${NODE_TYPE.FIRE_EXTINGUISHER}_${FE_CONFIG.CONFIG_0002}`]: {
        1: "Humidity",
        2: "Temperature",
        3: "Ultrasonic",
        4: "Missing",
        5: "N/A",
        6: "N/A",
        7: "FX Logic (Grams)",  // identifies: Missing | Leak | Foreign Object
        8: "N/A",
    },

    // FE Gauge v1.3
    [NODE_TYPE.FE_GAUGE_V1_3]: {
        1: "Humidity",
        2: "Temperature",
        3: "Ultrasonic",
        4: "Missing",
        5: "Gauge",
        6: "Safety Pin",
        7: "N/A",
        8: "N/A",
    },
};

// Helper — resolves the sensor label map key for FE nodes
export const getFeSensorKey = (config: FeConfig): string =>
    `${NODE_TYPE.FIRE_EXTINGUISHER}_${config}`;