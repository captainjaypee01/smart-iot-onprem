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
} as const;