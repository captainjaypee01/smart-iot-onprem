// src/config/nav.ts
// Central navigation config — add/remove routes here only, never in the sidebar component

import {
    LayoutDashboard,
    Cpu,
    BellRing,
    BarChart3,
    Map,
    Settings,
    ShieldCheck,
    Activity,
    FireExtinguisher,
    Users,
    User,
    Layers,
    Network,
    Building2,
} from "lucide-react";
import type { NavGroup } from "@/types/nav";
import { COMPANY_STRINGS } from "@/constants/strings";

export const NAV_GROUPS: NavGroup[] = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", path: "/", icon: LayoutDashboard, end: true },
            { label: "Live Monitor", path: "/monitor", icon: Activity },
        ],
    },
    {
        title: "IoT Modules",
        items: [
            { label: "Fire Extinguisher", path: "/fire-extinguisher", icon: FireExtinguisher },
            // future modules added here
        ],
    },
    {
        title: "IoT Management",
        items: [
            { label: "Nodes", path: "/nodes", icon: Cpu },
            { label: "Alerts", path: "/alerts", icon: BellRing, badge: 0 },
            { label: "Device Map", path: "/device-map", icon: Map },
        ],
    },
    {
        title: "Analytics",
        items: [
            { label: "Reports", path: "/reports", icon: BarChart3 },
        ],
    },
    {
        title: "System",
        items: [
            { label: "Users", path: "/users", icon: Users, permission: "user.view" },
            { label: "Profile", path: "/profile", icon: User },
            { label: "Settings", path: "/settings", icon: Settings },
            {
                label: COMPANY_STRINGS.NAV_COMPANY_SETTINGS,
                path: "/settings/company",
                icon: Building2,
                permission: "company.update",
                notSuperadmin: true,
            },
        ],
    },
    {
        title: "Superadmin",
        items: [
            {
                label: "Networks",
                path: "/networks",
                icon: Network,
                superadminOnly: true,
            },
            {
                label: "Node Types",
                path: "/node-types",
                icon: Layers,
                superadminOnly: true,
            },
            {
                label: "Permissions",
                path: "/permissions",
                icon: ShieldCheck,
                superadminOnly: true,
            },
            {
                label: COMPANY_STRINGS.NAV_COMPANIES,
                path: "/companies",
                icon: Building2,
                superadminOnly: true,
            },
        ],
    },
];