// src/constants/nodeTypes.ts
// Shared constants for diagnostic intervals, alarm threshold units, and Wirepas versions

import type {
    DiagnosticInterval,
    AlarmThresholdUnit,
    WirepasVersion,
} from "@/types/network";

export const DIAGNOSTIC_INTERVAL_OPTIONS: {
    value: DiagnosticInterval;
    label: string;
}[] = [
    { value: 5, label: "5 minutes" },
    { value: 10, label: "10 minutes" },
    { value: 30, label: "30 minutes" },
];

export const ALARM_THRESHOLD_UNIT_OPTIONS: {
    value: AlarmThresholdUnit;
    label: string;
}[] = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
];

export const WIREPAS_VERSION_OPTIONS: {
    value: WirepasVersion;
    label: string;
}[] = [
    { value: "5.2", label: "Wirepas 5.2" },
    { value: "5.1", label: "Wirepas 5.1" },
    { value: "5.0", label: "Wirepas 5.0" },
    { value: "4.0", label: "Wirepas 4.0" },
];

