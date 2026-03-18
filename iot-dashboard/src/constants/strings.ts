// src/constants/strings.ts
// All user-facing UI strings — labels, messages, placeholders, tooltips
// Never hardcode display text in components. Always import from here.

// ─── Auth ─────────────────────────────────────────────────────────
export const AUTH_STRINGS = {
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

// ─── Navbar ───────────────────────────────────────────────────────
export const NAVBAR_STRINGS = {
    TOGGLE_DARK: "Switch to dark mode",
    TOGGLE_LIGHT: "Switch to light mode",
    ALERTS: "Alerts",
    PROFILE: "Profile & Settings",
    SIGN_OUT: "Sign out",
    ROLE_PREFIX: "Role:",
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