// src/constants/strings.ts
// All user-facing UI strings — labels, messages, placeholders, tooltips
// Never hardcode display text in components. Always import from here.

// ─── Auth (UI / generic app copy) ─────────────────────────────────
// Named AUTH_UI_STRINGS to avoid clashing with `AUTH_FLOW_STRINGS` in `auth.ts` when using barrel `export *`.
export const AUTH_UI_STRINGS = {
    LOGIN_TITLE: "Welcome back",
    LOGIN_SUBTITLE: "Sign in to your account to continue",
    LOGIN_BUTTON: "Sign in",
    LOGIN_LOADING: "Signing in…",
    LOGIN_RESTRICTED: "Access is restricted to authorized personnel only.",
    LOGIN_CONTACT_ADMIN: "Contact your administrator if you need an account.",
    LABEL_EMAIL: "Email address",
    LABEL_PASSWORD: "Password",
    PLACEHOLDER_EMAIL: "you@company.com",
    PLACEHOLDER_PASSWORD: "••••••••",
    SSO_COMING_SOON: "Coming soon",
    LOGOUT_SUCCESS: "You have been signed out.",
    LOGIN_SUCCESS: (name: string) => `Welcome back, ${name}.`,
    ERROR_FALLBACK: "Unable to connect. Please try again.",
} as const;

// ─── Navigation ───────────────────────────────────────────────────
export const NAV_STRINGS = {
    COLLAPSE: "Collapse",
    EXPAND: "Expand sidebar",
    CLOSE: "Close sidebar",
    OPEN_MENU: "Open sidebar",
} as const;

// Feature registry group labels (from feature.group keys).
export const FEATURE_GROUP_STRINGS = {
    monitoring: "Monitoring",
    reports: "Reports",
    management: "Management",
    admin: "Admin",
} as const;

// ─── Feature module (superadmin registry UI) ──────────────────────
export const FEATURE_MODULE_STRINGS = {
    PAGE_TITLE: "Features",
    PAGE_SUBTITLE: "Reorder groups and pages, edit display names, and toggle availability.",
    NAV_ITEM: "Features",
    DIALOG_EDIT_TITLE: "Edit feature",
    DIALOG_CREATE_TITLE: "Create feature",
    LABEL_NAME: "Name",
    LABEL_ICON: "Icon",
    LABEL_ACTIVE: "Active",
    LABEL_KEY: "Key",
    LABEL_ROUTE: "Route",
    PLACEHOLDER_ICON: "e.g. LayoutDashboard",
    PLACEHOLDER_KEY: "e.g. fire-extinguisher",
    PLACEHOLDER_ROUTE: "e.g. /fire-extinguisher",
    PLACEHOLDER_NAME: "e.g. Fire Extinguisher",
    LABEL_GROUP: "Group",
    PLACEHOLDER_GROUP: "Select group",
    NEW_GROUP_OPTION: "New group",
    LABEL_NEW_GROUP_KEY: "New group key",
    PLACEHOLDER_NEW_GROUP_KEY: "e.g. custom-monitoring",
    LABEL_GROUP_ORDER: "Group order",
    LABEL_SORT_ORDER: "Sort order",
    GROUP_LABEL_NOTE: "Group labels are derived from the group key. Reordering is supported.",
    GROUP_CREATE_HELP: "You can create a new sidebar section by choosing a new group key. Drag the tabs to reorder groups.",
    ERROR_CREATE_MISSING_FIELDS: "Key, route, and name are required.",
    ERROR_CREATE_MISSING_GROUP_KEY: "Group key is required for a new group.",
    SUCCESS_CREATE: "Feature created.",
    ERROR_CREATE: "Failed to create feature.",
    SUCCESS_UPDATE: "Feature updated.",
    ERROR_UPDATE: "Failed to update feature.",
    SUCCESS_DELETE: "Feature deleted.",
    ERROR_DELETE: "Failed to delete feature.",
    ICON_SEARCH_PLACEHOLDER: "Search icon name…",
    ICON_PICKER_GROUP: "Lucide icons",
    ICON_PICKER_EMPTY: "No icons match your search.",
    CONFIRM_DELETE_TITLE: "Delete feature",
    CONFIRM_DELETE_DESCRIPTION: "Are you sure you want to delete this feature? This action cannot be undone.",
    CREATE_FEATURE: "Create feature",
    ERROR_REORDER_GROUPS: "Failed to reorder groups.",
    ERROR_REORDER_FEATURES: "Failed to reorder features.",
    ERROR_TOGGLE_ACTIVE: "Failed to update active state.",
    COL_ICON: "Icon",
    COL_NAME: "Name",
    COL_KEY: "Key",
    COL_ROUTE: "Route",
    COL_ACTIVE: "Active",
    COL_ACTIONS: "Actions",
    EDIT: "Edit",
    DELETE: "Delete",
    DRAG_GROUP_TAB_ARIA: "Drag to reorder group tab",
    DRAG_ROW_ARIA: "Drag to reorder feature",
    SUPERADMIN_ONLY: "Superadmin only",
} as const;

// ─── Navbar ───────────────────────────────────────────────────────
export const NAVBAR_STRINGS = {
    TOGGLE_DARK: "Switch to dark mode",
    TOGGLE_LIGHT: "Switch to light mode",
    ALERTS: "Alerts",
    PROFILE: "Profile",
    /** Session duration / app settings for a company (`/settings`). Not the same as company profile (`/settings/company`). */
    SESSION_SETTINGS: "Session settings",
    SIGN_OUT: "Sign out",
    ROLE_PREFIX: "Role:",
} as const;

// ─── Settings (session / app) ─────────────────────────────────────
export const SETTINGS_STRINGS = {
    FORBIDDEN_TITLE: "Access restricted",
    FORBIDDEN_DESCRIPTION:
        "You do not have permission to view or change session settings.",
} as const;

// ─── Dashboard ────────────────────────────────────────────────────
export const DASHBOARD_STRINGS = {
    TITLE: "Overview",
    TOTAL_NODES: "Total Nodes",
    ONLINE_NODES: "Online",
    OFFLINE_NODES: "Offline",
    OUTSTANDING_FAULTS: "Outstanding Faults",
    MODULES_LABEL: "Modules",
    LAST_UPDATED: "Last updated",
    VIEW_ALL: "View all",
    NO_FAULTS: "No outstanding faults.",
} as const;

// ─── Fault / Faults Table ─────────────────────────────────────────
export const FAULT_STRINGS = {
    TABLE_TITLE: "Outstanding Faults",
    COL_NODE_NAME: "Node Name",
    COL_FAULT_DESC: "Fault Description",
    COL_FAULT_DATETIME: "Fault Date & Time",
    COL_LOCATION: "Location",
    NO_RECORDS: "No outstanding faults found.",
    LOADING: "Loading faults…",
    ERROR: "Failed to load faults. Please refresh.",
    FILTER_PLACEHOLDER: "Search node or fault…",
    BADGE_OUTSTANDING: "Outstanding",
    BADGE_RESOLVED: "Resolved",
} as const;

// ─── Heatmap ──────────────────────────────────────────────────────
export const HEATMAP_STRINGS = {
    TITLE: "Fault Heatmap",
    BY_BUILDING: "By Building",
    BY_SECTOR: "By Sector",
    NODES_IN_SECTOR: (count: number) => `${count} node${count !== 1 ? "s" : ""}`,
    FAULTS_COUNT: (count: number) => `${count} fault${count !== 1 ? "s" : ""}`,
    NO_DATA: "No heatmap data available.",
    LEGEND_HEALTHY: "Healthy",
    LEGEND_MONITOR: "Monitor",
    LEGEND_ATTENTION: "Attention",
    LEGEND_CRITICAL: "Critical",
    LEGEND_SEVERE: "Severe",
} as const;

// ─── Nodes ────────────────────────────────────────────────────────
export const NODE_STRINGS = {
    TITLE: "Nodes",
    ADD_NODE: "Add Node",
    SEARCH_PLACEHOLDER: "Search nodes…",
    COL_NODE_NAME: "Node Name",
    COL_NODE_TYPE: "Node Type",
    COL_LOCATION: "Location",
    COL_STATUS: "Status",
    COL_LAST_SEEN: "Last Seen",
    STATUS_ONLINE: "Online",
    STATUS_OFFLINE: "Offline",
    STATUS_WARNING: "Warning",
    STATUS_ERROR: "Error",
    NO_NODES: "No nodes found.",
    SENSOR_PREFIX: "Sensor",
    SENSOR_NA: "N/A",
} as const;

// ─── Fire Extinguisher Module ─────────────────────────────────────
export const FE_STRINGS = {
    MODULE_TITLE: "Fire Extinguisher",
    DASHBOARD_TITLE: "FE Dashboard",
    TOTAL_FE_NODES: "Total FE Nodes",
    ACTIVE_FAULTS: "Active Faults",
    CONFIG_LABEL: "Config",
    NODE_TYPE_FE: "Fire Extinguisher",
    NODE_TYPE_FE_GAUGE: "FE Gauge (v1.3)",
} as const;

// ─── Users module ─────────────────────────────────────────────────
export const USER_STRINGS = {
    TITLE: "Users",
    SUBTITLE: "Manage user accounts and invitations.",
    INVITE_USER: "Invite user",
    EDIT_USER: "Edit user",
    NAME: "Name",
    FIRST_NAME: "First name",
    LAST_NAME: "Last name",
    USERNAME: "Username",
    EMAIL: "Email",
    ROLE: "Role",
    COMPANY: "Company",
    STATUS: "Status",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    JOINED: "Joined",
    LAST_LOGIN: "Last login",
    NEVER_LOGGED_IN: "Never logged in",
    RESEND_INVITE: "Resend invite",
    DISABLE: "Disable",
    ENABLE: "Enable",
    DELETE_USER: "Delete user",
    CONFIRM_DELETE: "Are you sure you want to delete this user?",
    USER_INVITED: "Invitation sent successfully.",
    USER_UPDATED: "User updated successfully.",
    USER_DISABLED: "User disabled.",
    USER_ENABLED: "User enabled.",
    INVITE_RESENT: "Invitation email resent.",
    USER_DELETED: "User deleted.",
    ERROR_LOAD: "Failed to load users.",
    ERROR_SAVE: "Failed to save user.",
    ERROR_DELETE: "Failed to delete user.",
    ERROR_RESEND: "Failed to resend invite.",
    ERROR_DISABLE: "Failed to update user status.",
    NO_ROLE: "No role",
    NO_COMPANY: "No company",
    SELECT_COMPANY_FIRST: "Select company first",
    ACTIONS: "Actions",
    NO_USERS: "No users.",
} as const;

// ─── Roles ─────────────────────────────────────────────────────
export const ROLE_STRINGS = {
    TITLE: "Roles",
    SEARCH_PLACEHOLDER: "Search roles…",

    COL_NAME: "Name",
    COL_COMPANY: "Company",
    COL_FEATURES: "Features",
    COL_PERMISSIONS: "Permissions",
    COL_NETWORKS: "Networks",
    COL_USERS: "Users",
    COL_SYSTEM: "System",
    COL_ACTIONS: "Actions",

    SYSTEM_ROLE: "System role",
    CREATE_ROLE: "Create Role",
    UPDATE_ROLE: "Update Role",
    DIALOG_TITLE_CREATE: "Create Role",
    DIALOG_TITLE_EDIT: "Edit Role",

    LABEL_NAME: "Name",
    LABEL_IS_SYSTEM_ROLE: "Is System Role",

    SECTION_PAGE_ACCESS: "Page Access",
    SECTION_ACTION_PERMISSIONS: "Action Permissions",
    SECTION_NETWORK_ACCESS: "Network Access",

    SELECT_ALL: "Select all",
    DESELECT_ALL: "Deselect all",
    SELECTED: "selected",
    NO_NETWORKS_FOR_COMPANY: "No networks assigned to this company.",
    SELECT_COMPANY_FIRST: "Select a company first",

    DELETE_409_TOOLTIP: "Role has active users and cannot be deleted.",
    CONFIRM_DELETE_TITLE: "Delete role",

    ERROR_LOAD: "Failed to load roles.",
    ERROR_DELETE: "Failed to delete role.",
    ROLE_DELETED: "Role deleted successfully.",

    EMPTY_NETWORKS: "No networks assigned to this company.",
    ERROR_SAVE: "Failed to save role.",
    ROLE_SAVED: "Role saved successfully.",

    // Role form page
    TAB_DETAILS: "Details",
    TAB_PAGE_ACCESS: "Page Access",
    TAB_PERMISSIONS: "Permissions",
    TAB_NETWORKS: "Networks",

    LABEL_ROLE_NAME: "Role Name",
    SUBTITLE_CREATE: "Create a new role.",
    SUBTITLE_EDIT: "Update role details and access.",
    SYSTEM_ROLE_HELPER: "System roles cannot be modified or deleted.",

    // Form page
    PLACEHOLDER_ROLE_NAME: "e.g. Operator",
    EDIT_ROLE_PREFIX: "Edit Role: ",
    OF: "of",
} as const;

// ─── Profile ──────────────────────────────────────────────────────
export const PROFILE_STRINGS = {
    TITLE: "Profile",
    SUBTITLE: "Your account details.",
    EDIT_PROFILE: "Edit profile",
    PROFILE_UPDATED: "Profile updated successfully.",
    ERROR_UPDATE: "Failed to update profile.",
} as const;

// ─── General UI ───────────────────────────────────────────────────
export const UI_STRINGS = {
    LOADING: "Loading…",
    ERROR_GENERIC: "Something went wrong. Please try again.",
    RETRY: "Retry",
    REFRESH: "Refresh",
    SAVE: "Save",
    CANCEL: "Cancel",
    CONFIRM: "Confirm",
    DELETE: "Delete",
    EDIT: "Edit",
    VIEW: "View",
    CLOSE: "Close",
    BACK: "Back",
    NEXT: "Next",
    PREVIOUS: "Previous",
    SEARCH: "Search",
    NO_RESULTS: "No results found.",
    FILTER: "Filter",
    EXPORT: "Export",
    ALL: "All",
    NONE: "None",
    YES: "Yes",
    NO: "No",
    N_A: "N/A",
    UNKNOWN: "Unknown",
    ROWS_PER_PAGE: "Rows per page",
    PREV: "Previous",
    NEXT_PAGE: "Next",
} as const;

// ─── Node Types module ─────────────────────────────────────────────
export const NODE_TYPE_STRINGS = {
    TITLE: "Node Types",
    SUBTITLE: "Manage global node type definitions and their sensors.",
    NAME: "Name",
    AREA_ID: "Area ID",
    DESCRIPTION: "Description",
    SENSORS: "Sensors",
    CREATE: "Create node type",
    EDIT: "Edit node type",
    SEARCH_PLACEHOLDER: "Search node types…",
    EMPTY: "No node types found.",
    LOAD_ERROR: "Failed to load node types.",
    ONE_SENSOR: "1 sensor",
    SENSORS_COUNT: "{count} sensors",
    DELETE_SUCCESS: "Node type deleted.",
    DELETE_ERROR: "Failed to delete node type.",
    DELETE_CONFIRM_TITLE: "Delete node type",
    DELETE_CONFIRM_DESCRIPTION:
        "Are you sure you want to delete this node type? This action cannot be undone.",
    IN_USE_TOOLTIP: "This node type is in use by one or more networks.",
    PAGINATION_SUMMARY: "Showing {from}–{to} of {total} node types",
    FORM_TITLE_CREATE: "Create node type",
    FORM_TITLE_EDIT: "Edit node type",
    LABEL_NAME: "Name",
    LABEL_AREA_ID: "Area ID",
    LABEL_DESCRIPTION: "Description",
    LABEL_SENSOR_NAME: "Sensor name",
    LABEL_SENSOR_UNIT: "Unit",
    AREA_ID_PLACEHOLDER: "e.g. A1B2C3",
    SENSOR_UNIT_PLACEHOLDER: "e.g. °C — leave blank if none",
    AREA_ID_INVALID: "Area ID must be 1–10 hex characters (0-9, A-F).",
    NAME_REQUIRED: "Name is required.",
    AREA_ID_REQUIRED: "Area ID is required.",
    ADD_SENSOR_BUTTON: "Add Sensor ({count}/8)",
    REMOVE_SENSOR_TOOLTIP:
        "Removing this sensor will also remove all sensors below it.",
    SAVE_SUCCESS_CREATE: "Node type created successfully.",
    SAVE_SUCCESS_UPDATE: "Node type updated successfully.",
    SAVE_ERROR: "Failed to save node type.",
} as const;

// ─── Networks module ────────────────────────────────────────────────
export const NETWORK_STRINGS = {
    TITLE: "Networks",
    SUBTITLE: "Configure and monitor IoT networks.",
    FORM_TITLE_CREATE: "Create network",
    FORM_TITLE_EDIT: "Edit network",
    LABEL_NAME: "Name",
    LABEL_NETWORK_ADDRESS: "Network address",
    LABEL_DESCRIPTION: "Description",
    LABEL_REMARKS: "Remarks",
    LABEL_IS_ACTIVE: "Active",
    LABEL_DIAGNOSTIC_INTERVAL: "Diagnostic interval",
    LABEL_ALARM_THRESHOLD: "Alarm threshold",
    LABEL_ALARM_UNIT: "Unit",
    LABEL_WIREPAS_VERSION: "Wirepas version",
    LABEL_COMMISSIONED_DATE: "Commissioned date",
    LABEL_IS_MAINTENANCE: "Maintenance window",
    LABEL_MAINTENANCE_START: "Maintenance start",
    LABEL_MAINTENANCE_END: "Maintenance end",
    LABEL_HAS_MONTHLY_REPORT: "Monthly report",
    LABEL_NODE_TYPES: "Node types",
    ADDRESS_INVALID: "Network address must match 0x followed by 6 hex characters.",
    MAINTENANCE_INVALID_RANGE: "Maintenance end must be after start.",
    TOGGLE_OFF_CONFIRM: "This will clear the maintenance window and mark the network as active.",
    TOGGLE_ACTION_LABEL: "Toggle maintenance",
    GENERATE_ADDRESS: "Generate",
    GENERATING_ADDRESS: "Generating…",
    SAVE_SUCCESS_CREATE: "Network created successfully.",
    SAVE_SUCCESS_UPDATE: "Network updated successfully.",
    SAVE_ERROR: "Failed to save network.",
} as const;

// ─── Company module ───────────────────────────────────────────────
export const COMPANY_STRINGS = {
    NAV_COMPANIES: "Companies",
    NAV_COMPANY_SETTINGS: "Company Settings",
    CARD_GENERAL_TITLE: "General",
    CARD_SECURITY_TITLE: "Security",

    TITLE: "Companies",
    SUBTITLE: "Manage tenant companies and their network access.",

    CREATE_COMPANY: "Create Company",
    SEARCH_PLACEHOLDER: "Search companies…",
    FILTER_ACTIVE_LABEL: "Active",
    FILTER_DEMO_LABEL: "Demo",

    NO_COMPANIES: "No companies found.",

    COL_CODE: "Code",
    COL_NAME: "Name",
    COL_TIMEZONE: "Timezone",
    COL_NETWORKS: "Networks",
    COL_USERS: "Users",
    COL_ACTIVE: "Active",
    COL_DEMO: "Demo",
    COL_ACTIONS: "Actions",

    BADGE_ACTIVE: "Active",
    BADGE_INACTIVE: "Inactive",
    BADGE_DEMO: "Demo",

    NETWORKS_COUNT_LABEL: (count: number) =>
        `${count} network${count === 1 ? "" : "s"}`,
    USERS_COUNT_LABEL: (count: number) =>
        `${count} user${count === 1 ? "" : "s"}`,

    CONFIRM_DELETE: "Are you sure you want to delete this company?",
    DELETE_409_TOOLTIP:
        "Company has active users and cannot be deleted.",
    COMPANY_DELETED: "Company deleted successfully.",
    ERROR_DELETE: "Failed to delete company.",

    UPLOAD_LOGO: "Upload Logo",

    // Dialog: identity
    DIALOG_TITLE_CREATE: "Create Company",
    DIALOG_TITLE_EDIT: "Edit Company",
    BUTTON_CREATE: "Create",
    BUTTON_UPDATE: "Update",
    LABEL_CODE: "Code",
    CODE_PLACEHOLDER: "e.g. ACME",
    LABEL_NAME: "Name",
    LABEL_ADDRESS: "Address",
    LABEL_CONTACT_EMAIL: "Contact Email",
    LABEL_CONTACT_PHONE: "Contact Phone",
    LABEL_TIMEZONE: "Timezone",
    LABEL_CUSTOM_ALARM_THRESHOLD: "Custom Alarm Threshold",
    LABEL_ALARM_UNIT: "Unit",
    CUSTOM_ALARM_THRESHOLD_PLACEHOLDER: "e.g. 10",
    CUSTOM_ALARM_HELPER:
        "Leave blank to use each network's own threshold.",

    LABEL_IS_DEMO: "Is Demo",
    LABEL_IS_ACTIVE_ZONE: "Is Active Zone",
    LABEL_IS_ACTIVE: "Is Active",

    LABEL_NETWORKS: "Networks",

    LABEL_LOGIN_ATTEMPTS: "Login Attempts",
    LABEL_2FA_ENFORCED: "2FA Enforced",

    LABEL_CURRENT_LOGO_PREVIEW: "Current logo preview",
    LABEL_COMPANY_LOGO: "Company Logo",

    TOAST_SAVE_SUCCESS: "Company updated successfully.",
    TOAST_SAVE_ERROR: "Failed to update company.",
    TOAST_LOGO_SUCCESS: "Company logo uploaded successfully.",
    TOAST_LOGO_ERROR: "Failed to upload company logo.",
} as const;

// ─── Gateway Settings module ──────────────────────────────────────
export const GATEWAY_STRINGS = {
    TITLE: 'Gateway Settings',
    SUBTITLE: 'Manage Wirepas gateway devices and send diagnostic commands.',
    NAV_LABEL: 'Gateway Settings',

    // Toolbar
    ADD_GATEWAY: 'Add Gateway',

    // Table columns
    COL_NAME: 'Name',
    COL_GATEWAY_ID: 'Gateway ID',
    COL_NETWORK: 'Network',
    COL_SINK_ID: 'Sink ID',
    COL_STATUS: 'Status',
    COL_TEST_MODE: 'Test Mode',
    COL_LAST_SEEN: 'Last Seen',
    COL_ACTIONS: 'Actions',

    // Status badge labels
    STATUS_ONLINE: 'Online',
    STATUS_OFFLINE: 'Offline',
    STATUS_UNKNOWN: 'Unknown',

    // Test mode badge
    TEST_MODE_ON: 'Test Mode',
    TEST_MODE_OFF: 'Production',

    // Filters
    FILTER_NETWORK_PLACEHOLDER: 'All Networks',
    FILTER_STATUS_PLACEHOLDER: 'All Statuses',
    FILTER_TEST_MODE_LABEL: 'Test Mode Only',

    // Form dialog
    DIALOG_TITLE_CREATE: 'Add Gateway',
    DIALOG_TITLE_EDIT: 'Edit Gateway',
    LABEL_NETWORK: 'Network',
    PLACEHOLDER_NETWORK: 'Select a network',
    LABEL_NAME: 'Name',
    PLACEHOLDER_NAME: 'e.g. Gateway Floor 1',
    LABEL_DESCRIPTION: 'Description',
    PLACEHOLDER_DESCRIPTION: 'Optional installation notes…',
    LABEL_IS_TEST_MODE: 'Test Mode',
    LABEL_GATEWAY_ID: 'Gateway ID',
    LABEL_SINK_ID: 'Sink ID',
    LABEL_GATEWAY_PREFIX: 'Gateway Prefix',
    PLACEHOLDER_GATEWAY_PREFIX: 'e.g. ABC123',
    GATEWAY_PREFIX_HELPER: 'Uppercase alphanumeric, max 10 characters. Required for the first gateway in this network.',
    GATEWAY_PREFIX_ALREADY_SET: 'This network already has a gateway prefix. New gateways will use the same prefix automatically.',
    ERROR_NETWORK_REQUIRED: 'Network is required.',
    ERROR_PREFIX_REQUIRED: 'Gateway prefix is required for the first gateway on this network.',
    ERROR_PREFIX_INVALID: 'Prefix must be uppercase alphanumeric only (e.g. ABC123).',
    ERROR_PREFIX_MAX: 'Prefix must be 10 characters or fewer.',
    ERROR_NAME_REQUIRED: 'Name is required.',
    ERROR_DESCRIPTION_MAX: 'Description must be 1000 characters or fewer.',
    GATEWAY_ID_READONLY_HELPER: 'Auto-generated. Cannot be changed after creation.',
    BUTTON_CREATE: 'Create Gateway',
    BUTTON_UPDATE: 'Update Gateway',
    SUCCESS_CREATE: 'Gateway created successfully.',
    ERROR_CREATE: 'Failed to create gateway.',
    SUCCESS_UPDATE: 'Gateway updated successfully.',
    ERROR_UPDATE: 'Failed to update gateway.',

    // Delete dialog
    CONFIRM_DELETE_TITLE: 'Delete Gateway',
    CONFIRM_DELETE_DESCRIPTION: (gatewayId: string, name: string) =>
        `Are you sure you want to delete gateway ${gatewayId} — ${name}? This action cannot be undone.`,
    SUCCESS_DELETE: 'Gateway deleted.',
    ERROR_DELETE: 'Failed to delete gateway.',

    // Send command dialog
    SEND_COMMAND_TITLE: 'Send Gateway Command',
    LABEL_COMMAND_TYPE: 'Command Type',
    PLACEHOLDER_COMMAND_TYPE: 'Select a command type',
    LABEL_PAYLOAD: 'Payload (hex)',
    PLACEHOLDER_PAYLOAD: 'e.g. DEADBEEF',
    PAYLOAD_HELPER: 'Optional hex string payload (0-9, A-F characters only).',
    CONFIRM_COMMAND_TITLE: 'Confirm Command',
    CONFIRM_COMMAND_DESCRIPTION: (type: string, gateway: string) =>
        `Send "${type}" command to gateway "${gateway}"?`,
    BUTTON_SEND_COMMAND: 'Send Command',
    BUTTON_SENDING: 'Sending…',
    SUCCESS_SEND_COMMAND: 'Command sent successfully.',
    ERROR_SEND_COMMAND: 'Failed to send command.',
    ERROR_PAYLOAD_HEX: 'Payload must contain only hex characters (0–9, A–F).',
    ERROR_COMMAND_TYPE_REQUIRED: 'Command type is required.',

    // Extended gateway fields
    LABEL_SERVICE_ID: 'Service ID',
    LABEL_ASSET_ID: 'Asset ID',
    LABEL_DEVICE_KEY: 'Device Key',
    LABEL_LOCATION: 'Location',
    LABEL_IP_ADDRESS: 'IP Address',
    LABEL_GATEWAY_VERSION: 'Gateway Version',
    PLACEHOLDER_SERVICE_ID: 'e.g. SVC-001',
    PLACEHOLDER_ASSET_ID: 'e.g. ASSET-001',
    PLACEHOLDER_DEVICE_KEY: 'e.g. dk-abc123',
    PLACEHOLDER_LOCATION: 'e.g. Floor 1, Server Room',
    PLACEHOLDER_GATEWAY_VERSION: 'e.g. 2.1.0',
    IP_ADDRESS_HELPER: 'Automatically populated when the gateway connects.',
    GATEWAY_VERSION_HELPER: 'Automatically populated when the gateway connects.',
    ERROR_SERVICE_ID_REQUIRED: 'Service ID is required.',

    // Send command dialog — typed actions
    LABEL_DIAGNOSTIC_TYPE: 'Diagnostic Type',
    LABEL_SERVICE_NAME: 'Service Name',
    BUTTON_RESTART_GATEWAY: 'Restart Gateway',
    BUTTON_GET_DIAGNOSTIC: 'Get Diagnostic',
    BUTTON_UPLOAD_LOGS: 'Upload Log Files',
    CONFIRM_RESTART_GATEWAY: 'Are you sure you want to restart this gateway? The gateway will be temporarily offline.',
    CONFIRM_RESTART_GATEWAY_TITLE: 'Restart Gateway',
    SUCCESS_RESTART_GATEWAY: 'Restart command sent successfully.',
    SUCCESS_SEND_DIAGNOSTIC: 'Diagnostic command sent successfully.',

    // Detail page
    DETAIL_SUBTITLE: 'Gateway detail',
    LABEL_STATUS: 'Status',
    LABEL_LAST_SEEN: 'Last Seen',
    LABEL_CREATED_AT: 'Created',
    LABEL_UPDATED_AT: 'Updated',
    NEVER_SEEN: 'Never connected',
    SEND_COMMAND: 'Send Command',
    EDIT_GATEWAY: 'Edit Gateway',
    BACK_TO_GATEWAYS: 'Back to Gateways',

    // Row actions
    ACTION_VIEW: 'View',
    ACTION_EDIT: 'Edit',
    ACTION_DELETE: 'Delete',
    ACTION_SEND_COMMAND: 'Send Command',

    // Empty / error
    NO_GATEWAYS: 'No gateways found.',
    ERROR_LOAD: 'Failed to load gateways.',
    ERROR_LOAD_DETAIL: 'Failed to load gateway.',
} as const;

export const GATEWAY_STATUS_LABELS: Record<'online' | 'offline' | 'unknown', string> = {
    online: GATEWAY_STRINGS.STATUS_ONLINE,
    offline: GATEWAY_STRINGS.STATUS_OFFLINE,
    unknown: GATEWAY_STRINGS.STATUS_UNKNOWN,
} as const;

export const GATEWAY_COMMAND_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'get_configs', label: 'Get Configs' },
    { value: 'otap_load_scratchpad', label: 'OTAP Load Scratchpad' },
    { value: 'otap_process_scratchpad', label: 'OTAP Process Scratchpad' },
    { value: 'otap_set_target_scratchpad', label: 'OTAP Set Target Scratchpad' },
    { value: 'otap_status', label: 'OTAP Status' },
    { value: 'upload_software_update', label: 'Upload Software Update' },
    { value: 'diagnostic', label: 'Diagnostic' },
    { value: 'sync_gateway_time', label: 'Sync Gateway Time' },
    { value: 'renew_certificate', label: 'Renew Certificate' },
] as const;

// ─── Node Provisioning module ─────────────────────────────────────
export const PROVISIONING_STRINGS = {
    TITLE: "Node Provisioning",
    SUBTITLE: "Register IoT nodes into networks in batches of up to 10.",
    NEW_PROVISIONING: "New Provisioning",
    BACK: "Back",

    // List page
    COL_NETWORK: "Network",
    COL_SUBMITTED_BY: "Submitted By",
    COL_DATE: "Date",
    COL_TOTAL_NODES: "Total Nodes",
    COL_STATUS_SUMMARY: "Status Summary",
    COL_STATUS: "Status",
    COL_ACTIONS: "Actions",
    VIEW: "View",
    FILTER_NETWORK_PLACEHOLDER: "All Networks",
    FILTER_STATUS_PLACEHOLDER: "All Statuses",
    NO_BATCHES: "No provisioning batches found.",
    ERROR_LOAD: "Failed to load provisioning batches.",
    REFRESH: "Refresh",

    // Status badge labels
    STATUS_PENDING: "Pending",
    STATUS_PARTIAL: "Partial",
    STATUS_COMPLETE: "Complete",
    STATUS_FAILED: "Failed",

    // New provisioning form
    NEW_TITLE: "New Provisioning",
    LABEL_NETWORK: "Network",
    LABEL_TARGET_NODE_ID: "Target Node ID",
    TARGET_NODE_ID_HELPER: "Enter a specific gateway address, or 'FFFFFFFF' to broadcast to all gateways.",
    LABEL_IS_AUTO_REGISTER: "Auto Register",
    LABEL_SERVICE_ID: "Service ID",
    LABEL_NODE_ADDRESS: "Node Address",
    NODE_SECTION_TITLE: "Nodes",
    ADD_NODE: "Add Node",
    ADD_NODE_COUNT: (count: number) => `Add Node (${count}/10)`,
    REMOVE_NODE: "Remove node",
    ROW_NUMBER: (n: number) => `${n}`,
    SUBMIT: "Submit Provisioning",
    SUBMITTING: "Submitting…",
    SUCCESS_SUBMIT: "Provisioning batch submitted. Primary and broadcast batches created.",
    ERROR_SUBMIT: "Failed to submit provisioning batch.",
    ERROR_SERVICE_ID_REQUIRED: "Service ID is required.",
    ERROR_NODE_ADDRESS_REQUIRED: "Node Address is required.",
    ERROR_NODE_ADDRESS_MAX: "Node Address must be 10 characters or fewer.",
    ERROR_TARGET_NODE_ID_REQUIRED: "Target Node ID is required.",
    ERROR_TARGET_NODE_ID_MAX: "Target Node ID must be 10 characters or fewer.",
    ERROR_DUPLICATE_SERVICE_ID: "Duplicate Service ID.",
    NETWORK_NOT_FOUND: "Network not found.",

    // Detail page
    DETAIL_SUBTITLE: "Provisioning batch detail",
    LABEL_NETWORK_ADDRESS: "Network Address",
    LABEL_SUBMITTED_DATE: "Submitted",
    SUBMITTED_BY_SYSTEM: "System",
    COL_NODE_NUMBER: "#",
    COL_SERVICE_ID: "Service ID",
    COL_NODE_ADDRESS: "Node Address",
    STATUS_PROVISIONED: "Provisioned",
    RESEND: "Resend",
    RESENDING: "Resending…",
    RESEND_SUCCESS: (serviceId: string) => `Resend submitted for ${serviceId}.`,
    ERROR_RESEND: "Failed to resend node.",
    ERROR_LOAD_DETAIL: "Failed to load provisioning batch.",
} as const;

// ─── Node Decommission module ─────────────────────────────────────
export const NODE_DECOMMISSION_STRINGS = {
    TITLE: 'Node Decommission',
    SUBTITLE: 'Remove IoT nodes from a network.',
    NAV_LABEL: 'Node Decommission',

    // Network selector
    SELECT_NETWORK_LABEL: 'Network',
    SELECT_NETWORK_PLACEHOLDER: 'Select a network to view nodes',

    // Node list tab
    NODE_LIST_TITLE: 'Decommissionable Nodes',
    SEARCH_PLACEHOLDER: 'Search by name or service ID\u2026',
    FILTER_NODE_TYPE_PLACEHOLDER: 'All Node Types',
    NO_NODES: 'No nodes available for decommissioning in this network.',
    COL_NODE_NAME: 'Node Name',
    COL_NODE_ADDRESS: 'Node Address',
    COL_SERVICE_ID: 'Service ID',
    COL_STATUS: 'Status',
    COL_LAST_ATTEMPT: 'Last Decommission Attempt',
    COL_ACTIONS: 'Actions',

    // History tab
    HISTORY_TITLE: 'Decommission History',
    NO_HISTORY: 'No decommission history for this network.',
    FILTER_STATUS_PLACEHOLDER: 'All Statuses',
    COL_HISTORY_NODE: 'Node',
    COL_HISTORY_NODE_ADDRESS: 'Node Address',
    COL_HISTORY_INITIATED_BY: 'Initiated By',
    COL_HISTORY_STATUS: 'Status',
    COL_HISTORY_VERIFICATION: 'Verification',
    COL_HISTORY_DECOMMISSIONED_AT: 'Decommissioned At',
    COL_HISTORY_DATE: 'Date',
    INITIATED_BY_UNKNOWN: '\u2014',
    VERIFICATION_TIMED_OUT: 'Timed Out',

    // Node status badge labels
    NODE_STATUS_NEW: 'New',
    NODE_STATUS_ACTIVE: 'Active',

    // Log status badge labels
    LOG_STATUS_PENDING: 'Pending',
    LOG_STATUS_COMPLETED: 'Completed',
    LOG_STATUS_FAILED: 'Failed',
    LOG_STATUS_MANUAL: 'Manual',

    // Row action buttons
    ACTION_DECOMMISSION: 'Decommission',
    ACTION_RESEND: 'Resend',
    ACTION_VERIFY: 'Verify',
    ACTION_MANUAL: 'Manual',
    ACTION_VIEW: 'View',

    // Detail dialog
    DETAIL_DIALOG_TITLE: 'Decommission Log Details',
    DETAIL_SECTION_NODE: 'Node',
    DETAIL_SECTION_DECOMMISSION: 'Decommission Command',
    DETAIL_SECTION_VERIFICATION: 'Verification Command',
    DETAIL_SECTION_TIMESTAMPS: 'Timestamps',
    DETAIL_LABEL_NODE_NAME: 'Name',
    DETAIL_LABEL_SERVICE_ID: 'Service ID',
    DETAIL_LABEL_NODE_ADDRESS: 'Node Address',
    DETAIL_LABEL_STATUS: 'Status',
    DETAIL_LABEL_INITIATED_BY: 'Initiated By',
    DETAIL_LABEL_PACKET_ID: 'Packet ID',
    DETAIL_LABEL_PAYLOAD: 'Payload',
    DETAIL_LABEL_COMMAND_ID: 'Command ID',
    DETAIL_LABEL_FULL_FRAME: 'Full Frame',
    DETAIL_LABEL_VERIFY_PACKET_ID: 'Verify Packet ID',
    DETAIL_LABEL_VERIFY_PAYLOAD: 'Verify Payload',
    DETAIL_LABEL_VERIFY_COMMAND_ID: 'Verify Command ID',
    DETAIL_LABEL_VERIFY_SENT_AT: 'Sent At',
    DETAIL_LABEL_VERIFY_EXPIRES_AT: 'Expires At',
    DETAIL_LABEL_ERROR: 'Error',
    DETAIL_LABEL_DECOMMISSIONED_AT: 'Decommissioned At',
    DETAIL_LABEL_CREATED_AT: 'Created At',
    DETAIL_LABEL_UPDATED_AT: 'Updated At',
    DETAIL_NO_VERIFY_SENT: 'No verification command sent yet.',

    // Decommission dialog
    DECOMMISSION_DIALOG_TITLE: 'Send Decommission Command',
    DECOMMISSION_DIALOG_BODY: 'This will send the decommission command to the node. If the node does not respond within 2 minutes, a Verify option will appear to check whether it is still online.',
    COMMAND_PREVIEW_LABEL: 'Command to be sent',
    COMMAND_PREVIEW_HINT: 'The packet ID is generated automatically. The payload is fixed for all decommission commands.',
    DECOMMISSION_SUBMIT_LABEL: 'Send Decommission',
    DECOMMISSION_SUBMITTING_LABEL: 'Sending\u2026',

    // Manual decommission dialog
    MANUAL_CONFIRM_TITLE: 'Manual Decommission',
    MANUAL_CONFIRM_BODY: (nodeName: string) =>
        `Are you sure you want to manually mark "${nodeName}" as decommissioned? No command will be sent to the IoT network. This action cannot be easily undone.`,
    MANUAL_CONFIRM_SUBMIT: 'Mark as Decommissioned',
    MANUAL_CONFIRM_SUBMITTING: 'Processing\u2026',

    // Toast messages
    SUCCESS_DECOMMISSION: 'Decommission command sent.',
    SUCCESS_RESEND: 'Decommission command resent.',
    SUCCESS_VERIFY: 'Verification sent. Expires in 2 minutes.',
    SUCCESS_MANUAL: 'Node manually marked as decommissioned.',
    ERROR_DECOMMISSION: 'Failed to send decommission command.',
    ERROR_RESEND: 'Failed to resend decommission command.',
    ERROR_VERIFY: 'Failed to send verification command.',
    ERROR_MANUAL: 'Failed to manually decommission node.',

    // Data fetch errors
    ERROR_LOAD_NODES: 'Failed to load nodes.',
    ERROR_LOAD_HISTORY: 'Failed to load decommission history.',
} as const;