// src/constants/permissions.ts
// UI-facing permission grouping metadata used to organize permissions on Access Control pages.

/**
 * Mapping from concrete permission keys or simple wildcard prefixes
 * to UI group identifiers. This is purely for presentation and does
 * not affect backend authorization logic.
 */
export const PERMISSION_UI_GROUPS: Record<string, string> = {
    // ── User permissions ───────────────────────────────────────────────
    "user.view": "user_basic",
    "user.create": "user_manage",
    "user.update": "user_manage",
    "user.disable": "user_advanced",
    "user.delete": "user_advanced",
    "user.resend_invite": "user_advanced",
    "user.change_status": "user_advanced",
    "user.change_company": "user_advanced",

    // ── Company permissions ────────────────────────────────────────────
    "company.*": "company_manage",

    // ── Role & Permission admin (special, cross-cutting) ──────────────
    "role.*": "system_admin",
    "permission.*": "system_admin",

    // ── Fallbacks for other modules can be added over time ────────────
};

export const PERMISSION_UI_GROUP_LABELS: Record<string, string> = {
    user_basic: "User Basics",
    user_manage: "User Management",
    user_advanced: "User Management (Advanced)",
    company_manage: "Company Management",
    system_admin: "System Administration",
};

/**
 * Resolve a UI group key for a given permission key using the
 * configuration above. Exact match wins, then wildcard prefix
 * (e.g. `role.*`), otherwise returns null.
 */
export const getPermissionUiGroupKey = (permissionKey: string): string | null => {
    if (PERMISSION_UI_GROUPS[permissionKey]) {
        return PERMISSION_UI_GROUPS[permissionKey];
    }

    // simple wildcard matching: `module.*`
    const [module] = permissionKey.split(".");
    const wildcardKey = `${module}.*`;
    if (PERMISSION_UI_GROUPS[wildcardKey]) {
        return PERMISSION_UI_GROUPS[wildcardKey];
    }

    return null;
};

