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
    FireExtinguisher
} from "lucide-react";
import type { NavGroup } from "@/types/nav";

export const NAV_GROUPS: NavGroup[] = [
    {
        title: "Overview",
        items: [
            {
                label: "Dashboard",
                path: "/",
                icon: LayoutDashboard,
                end: true,
            },
            {
                label: "Fire Extinguisher",
                path: "/fire-extinguisher",
                icon: FireExtinguisher,
            },
            {
                label: "Live Monitor",
                path: "/monitor",
                icon: Activity,
            },
        ],
    },
    {
        title: "IoT Management",
        items: [
            {
                label: "Nodes",
                path: "/nodes",
                icon: Cpu,
            },
            {
                label: "Alerts",
                path: "/alerts",
                icon: BellRing,
                badge: 0,   // populated dynamically from store/API
            },
            {
                label: "Device Map",
                path: "/device-map",
                icon: Map,
            },
        ],
    },
    {
        title: "Analytics",
        items: [
            {
                label: "Reports",
                path: "/reports",
                icon: BarChart3,
            },
        ],
    },
    {
        title: "System",
        items: [
            {
                label: "Access Control",
                path: "/access-control",
                icon: ShieldCheck,
            },
            {
                label: "Settings",
                path: "/settings",
                icon: Settings,
            },
        ],
    },
];