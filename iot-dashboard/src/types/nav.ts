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
    /** When true, hide the item when the user is a superadmin. */
    notSuperadmin?: boolean;
    /** When true, show only when useRole().isSuperAdmin() is true. */
    superadminOnly?: boolean;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}