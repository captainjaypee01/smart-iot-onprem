// src/types/nav.ts
// Navigation types used by Sidebar and AppRouter

import type { LucideIcon } from "lucide-react";

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    badge?: number;        // e.g. unread alert count
    end?: boolean;       // exact match for active state (react-router)
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}