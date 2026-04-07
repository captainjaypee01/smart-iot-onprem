// src/types/network.ts
// TypeScript types for the Network module contracts

export type DiagnosticInterval = 5 | 10 | 30;

export type AlarmThresholdUnit = "minutes" | "hours";

export type WirepasVersion = "5.2" | "5.1" | "5.0" | "4.0";

export interface NetworkNodeType {
    id: number;
    name: string;
    area_id: string;
}

export interface Network {
    id: number;
    name: string;
    network_address: string;
    description: string | null;
    remarks: string | null;
    is_active: boolean;
    diagnostic_interval: DiagnosticInterval;
    alarm_threshold: number;
    alarm_threshold_unit: AlarmThresholdUnit;
    wirepas_version: WirepasVersion | null;
    commissioned_date: string | null; // YYYY-MM-DD
    is_maintenance: boolean;
    maintenance_start_at: string | null; // ISO8601
    maintenance_end_at: string | null; // ISO8601
    has_monthly_report: boolean;
    node_types: NetworkNodeType[];
    created_at: string;
    updated_at: string;
}

export interface NetworkListResponse {
    data: Network[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string;
        next: string | null;
        prev: string | null;
        last: string;
    };
}

export interface NetworkOption {
    id: number;
    name: string;
    network_address: string;
    is_active: boolean;
    gateway_prefix?: string | null;
}

export interface GenerateAddressResponse {
    data: { network_address: string };
}

export interface StoreNetworkPayload {
    name: string;
    network_address: string;
    description?: string | null;
    remarks?: string | null;
    is_active?: boolean;
    diagnostic_interval: DiagnosticInterval;
    alarm_threshold: number;
    alarm_threshold_unit: AlarmThresholdUnit;
    wirepas_version?: WirepasVersion | null;
    commissioned_date?: string | null;
    is_maintenance?: boolean;
    maintenance_start_at?: string | null;
    maintenance_end_at?: string | null;
    has_monthly_report?: boolean;
    node_types?: number[];
}

export type UpdateNetworkPayload = Partial<StoreNetworkPayload>;

export interface ToggleMaintenancePayload {
    is_maintenance: boolean;
    maintenance_start_at?: string | null;
    maintenance_end_at?: string | null;
}

