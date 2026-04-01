// src/constants/commands.ts
// All user-facing strings, status option arrays, and magic values for the Command Console module.
// Import from here — never hardcode display text in components.

import type { ProcessingStatusValue, MessageStatusValue } from '@/types/command';

// ─── Processing Status dropdown options ───────────────────────────
export const PROCESSING_STATUS_OPTIONS: {
    value: ProcessingStatusValue;
    label: string;
}[] = [
    { value: 1, label: 'Pending' },
    { value: 2, label: 'Processing' },
    { value: 3, label: 'Sent' },
    { value: 4, label: 'Failed' },
];

// ─── Message Status dropdown options ──────────────────────────────
export const MESSAGE_STATUS_OPTIONS: {
    value: MessageStatusValue;
    label: string;
}[] = [
    { value: 1,  label: 'Node Responded' },
    { value: 2,  label: 'Node Responded with Error' },
    { value: 3,  label: 'Waiting for Response from Node' },
    { value: 4,  label: 'Alarm Acknowledge' },
    { value: 5,  label: 'Group Message' },
    { value: 6,  label: 'Network Message' },
    { value: 7,  label: 'Gateway Responded' },
    { value: 8,  label: 'Sink Message' },
    { value: 9,  label: 'Zone Message' },
    { value: 10, label: 'Zone Group Message' },
];

// ─── All user-facing strings ───────────────────────────────────────
export const COMMAND_STRINGS = {
    // Page header
    PAGE_TITLE: 'Command Console',
    PAGE_SUBTITLE: 'Send IoT node commands and monitor their delivery status.',

    // Sidebar / nav label
    NAV_LABEL: 'Command Console',

    // ── Send Command form ────────────────────────────────────────
    FORM_SECTION_TITLE: 'Send Command',
    LABEL_NETWORK: 'Network',
    PLACEHOLDER_NETWORK: 'Select a network',
    LABEL_NODE_ADDRESS: 'Node Address',
    PLACEHOLDER_NODE_ADDRESS: 'e.g. A3F2B1',
    LABEL_SOURCE_EP: 'Source Endpoint',
    PLACEHOLDER_SOURCE_EP: '1–255',
    LABEL_DEST_EP: 'Destination Endpoint',
    PLACEHOLDER_DEST_EP: '1–255',
    LABEL_PAYLOAD: 'Payload',
    PLACEHOLDER_PAYLOAD: 'e.g. DEADBEEF',
    LABEL_TRACKING_MODE: 'Tracking ID',
    TRACKING_MODE_AUTO: 'Auto (Generate)',
    TRACKING_MODE_MANUAL: 'Manual',
    TRACKING_MODE_NONE: 'No Tracking',
    HELPER_TRACKING_MODE: 'Auto generates a random 2-byte packet ID. Manual lets you set it. No Tracking sends without a packet ID.',
    LABEL_PACKET_ID: 'Packet ID',
    PLACEHOLDER_PACKET_ID: 'e.g. AB12',
    HELPER_PACKET_ID: 'Exactly 4 hex characters (2-byte tracking ID).',

    SUBMIT_BUTTON: 'Send Command',
    SUBMITTING_BUTTON: 'Sending…',

    SUCCESS_SEND: 'Command sent successfully.',
    ERROR_SEND: 'Failed to send command.',

    // Validation messages
    ERROR_NETWORK_REQUIRED: 'Network is required.',
    ERROR_NODE_ADDRESS_REQUIRED: 'Node Address is required.',
    ERROR_NODE_ADDRESS_MAX: 'Node Address must be 10 characters or fewer.',
    ERROR_NODE_ADDRESS_HEX: 'Node Address must contain only hex characters (0–9, A–F).',
    ERROR_SOURCE_EP_RANGE: 'Source Endpoint must be between 1 and 255.',
    ERROR_DEST_EP_RANGE: 'Destination Endpoint must be between 1 and 255.',
    ERROR_PAYLOAD_HEX: 'Payload must contain only hex characters (0–9, A–F).',
    ERROR_PACKET_ID_REQUIRED: 'Packet ID is required when Include Tracking ID is enabled.',
    ERROR_PACKET_ID_FORMAT: 'Packet ID must be exactly 4 hex characters.',

    // ── Command History table ─────────────────────────────────────
    HISTORY_SECTION_TITLE: 'Command History',
    COL_SENT_AT: 'Sent At',
    COL_NETWORK: 'Network',
    COL_NODE_ADDRESS: 'Node Address',
    COL_TYPE: 'Type',
    COL_PROCESSING_STATUS: 'Processing Status',
    COL_MESSAGE_STATUS: 'Message Status',
    COL_PACKET_ID: 'Packet ID',
    COL_RETRY: 'Retry',
    COL_CREATED_BY: 'Created By',
    COL_ACTIONS: 'Actions',
    NO_COMMANDS: 'No commands found.',
    ERROR_LOAD: 'Failed to load command history.',

    // ── Filters bar ───────────────────────────────────────────────
    FILTER_NETWORK_PLACEHOLDER: 'All Networks',
    FILTER_PROCESSING_STATUS_PLACEHOLDER: 'All Processing Statuses',
    FILTER_MESSAGE_STATUS_PLACEHOLDER: 'All Message Statuses',
    FILTER_NODE_ADDRESS_PLACEHOLDER: 'Node address…',
    FILTER_DATE_FROM_PLACEHOLDER: 'From date',
    FILTER_DATE_TO_PLACEHOLDER: 'To date',
    RESET_FILTERS: 'Reset',

    // ── Auto-refresh toggle ───────────────────────────────────────
    AUTO_REFRESH_LABEL: 'Auto-refresh',
    AUTO_REFRESH_ACTIVE_TITLE: 'Auto-refresh is active (every 15 s)',
    AUTO_REFRESH_INACTIVE_TITLE: 'Auto-refresh is paused',

    // ── Row actions ───────────────────────────────────────────────
    ACTION_RESEND: 'Resend',
    ACTION_RESENDING: 'Resending…',
    SUCCESS_RESEND: 'Command resend submitted.',
    ERROR_RESEND: 'Failed to resend command.',

    // ── Misc ──────────────────────────────────────────────────────
    RETRY_COUNT_LABEL: (count: number) =>
        count === 0 ? '—' : `${count} retry${count !== 1 ? 's' : ''}`,

    // ── Command Detail Dialog ─────────────────────────────────────
    DIALOG_TITLE: 'Command Details',
    DIALOG_CLOSE: 'Close',
    ACTION_VIEW: 'View',
    COL_ENDPOINTS: 'Endpoints',
    LABEL_TYPE: 'Type',
    LABEL_ENDPOINTS: 'Endpoints',
    LABEL_REQUEST_ID: 'Request ID',
    LABEL_NO_TRACKING: 'No Tracking',
    LABEL_ERROR: 'Error',
    LABEL_REQUESTED_AT: 'Requested At',
    LABEL_DISPATCHED_AT: 'Dispatched At',
    LABEL_ACKED_AT: 'Acked At',
    LABEL_COMPLETED_AT: 'Completed At',
    LABEL_RETRY_BY: 'Retry By',
    ERROR_LOAD_DETAIL: 'Failed to load command details.',
} as const;
