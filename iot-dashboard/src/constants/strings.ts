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