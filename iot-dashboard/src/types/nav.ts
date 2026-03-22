// src/types/nav.ts
// Navigation types used by Sidebar and AppRouter

import type { LucideIcon } from "lucide-react";

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    badge?: number;        // e.g. unread alert count
    end?: boolean;         // exact match for active state (react-router)
    /** When true, show only when useRole().isAdmin() is true. */
    adminOnly?: boolean;
    /** When set, show only when usePermission().hasPermission(permission) is true (e.g. 'user.view'). */
    permission?: string;
    /**
     * When set, show only when the user has this feature key assigned via `/auth/me`.
     * Useful for "superadminOnly" items that should be visible for superadmin-equivalent roles.
     */
    featureKey?: string;
    /** When true, hide the item when the user is a superadmin. */
    notSuperadmin?: boolean;
    /** When true, show only when useRole().isSuperAdmin() is true. */
    superadminOnly?: boolean;
    /**
     * When true, always show for any authenticated user (e.g. Profile / account).
     * Use for routes that must remain reachable even when role_features is empty.
     */
    accountOnly?: boolean;
    /**
     * When true, show only when the user has at least one feature from `/auth/me.features`,
     * or is superadmin. Hides app nav like Settings when the role has zero page access.
     */
    requiresFeatures?: boolean;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}