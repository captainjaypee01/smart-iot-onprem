// src/types/command.ts
// TypeScript types for the Command Console module contract

// ─── Processing Status ─────────────────────────────────────────────
// Stored as tinyint unsigned in the DB; labels come from the API resource.
export const PROCESSING_STATUS = {
    PENDING:    1,
    PROCESSING: 2,
    SENT:       3,
    FAILED:     4,
} as const;

export type ProcessingStatusValue = (typeof PROCESSING_STATUS)[keyof typeof PROCESSING_STATUS];

// ─── Message Status ────────────────────────────────────────────────
// Stored as tinyint unsigned, nullable. See spec for classification rules.
export const MESSAGE_STATUS = {
    NODE_RESPONDED:           1,
    NODE_RESPONDED_WITH_ERROR: 2,
    WAITING_FOR_RESPONSE:     3,
    ALARM_ACKNOWLEDGE:        4,
    GROUP_MESSAGE:            5,
    NETWORK_MESSAGE:          6,
    GATEWAY_RESPONDED:        7,
    SINK_MESSAGE:             8,
    ZONE_MESSAGE:             9,
    ZONE_GROUP_MESSAGE:       10,
} as const;

export type MessageStatusValue = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

// ─── CommandRecord ─────────────────────────────────────────────────
// Shape returned by CommandResource for every command endpoint.
export interface CommandRecord {
    id: string; // primary key
    network: {
        id: number;
        name: string;
        network_address?: string;
    };
    created_by: { id: number; name: string } | null;
    retry_by: { id: number; name: string } | null;
    type: string;
    node_address: string | null;
    request_id: number | null;
    source_ep: number | null;
    dest_ep: number | null;
    payload: string | null;
    no_packet_id: boolean;
    packet_id: string | null;
    processing_status: ProcessingStatusValue | null;
    processing_status_label: string | null;
    message_status: MessageStatusValue | null;
    message_status_label: string | null;
    retry_count: number;
    retry_at: string | null;
    error_message: string | null;
    error_code: string | null;
    requested_at: string | null;
    dispatched_at: string | null;
    acked_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

// ─── SendCommandPayload ────────────────────────────────────────────
// POST /api/v1/commands request body.
export interface SendCommandPayload {
    network_id: number;
    node_address: string;
    source_ep?: number | null;
    dest_ep?: number | null;
    payload?: string | null;
    include_tracking_id: 'auto' | 'manual' | 'none';
    packet_id?: string | null;
}

// ─── CommandFilters ────────────────────────────────────────────────
// GET /api/v1/commands query parameters (excluding page/per_page).
export interface CommandFilters {
    network_id?: number;
    processing_status?: ProcessingStatusValue;
    message_status?: MessageStatusValue;
    node_address?: string;
    date_from?: string; // YYYY-MM-DD
    date_to?: string;   // YYYY-MM-DD
}

// ─── Paginated list response ───────────────────────────────────────
export interface CommandListResponse {
    data: CommandRecord[];
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
