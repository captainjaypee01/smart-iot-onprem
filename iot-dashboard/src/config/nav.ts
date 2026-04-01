// src/config/nav.ts
// Central navigation config — add/remove routes here only, never in the sidebar component

import {
    Map,
    Settings,
    ShieldCheck,
    Activity,
    User,
    Layers,
    Network,
    Building2,
    LayoutList,
    ServerCog,
    Terminal,
} from "lucide-react";
import type { NavGroup } from "@/types/nav";
import {
    COMPANY_STRINGS,
    FEATURE_MODULE_STRINGS,
    NAVBAR_STRINGS,
    PROVISIONING_STRINGS,
    ROLE_STRINGS,
} from "@/constants/strings";
import { COMMAND_STRINGS } from "@/constants/commands";

export const NAV_GROUPS: NavGroup[] = [
    {
        title: "Overview",
        items: [
            {
                label: "Live Monitor",
                path: "/monitor",
                icon: Activity,
                featureKey: "dashboard",
            },
        ],
    },
    {
        title: "IoT Modules",
        items: [
            // future modules added here
        ],
    },
    {
        title: "IoT Management",
        items: [
            { label: "Device Map", path: "/device-map", icon: Map },
            {
                label: COMMAND_STRINGS.NAV_LABEL,
                path: "/commands",
                icon: Terminal,
                featureKey: "command-console",
                permission: "command.view",
            },
        ],
    },
    {
        title: "Analytics",
        items: [
        ],
    },
    {
        title: "System",
        items: [
            { label: "Profile", path: "/profile", icon: User, accountOnly: true },
            {
                label: NAVBAR_STRINGS.SESSION_SETTINGS,
                path: "/settings",
                icon: Settings,
                adminOnly: true,
            },
            {
                label: COMPANY_STRINGS.NAV_COMPANY_SETTINGS,
                path: "/settings/company",
                icon: Building2,
                featureKey: "company-settings",
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
                featureKey: "networks",
            },
            {
                label: "Node Types",
                path: "/node-types",
                icon: Layers,
                superadminOnly: true,
                featureKey: "node-types",
            },
            {
                label: PROVISIONING_STRINGS.TITLE,
                path: "/provisioning",
                icon: ServerCog,
                superadminOnly: true,
            },
            {
                label: "Permissions",
                path: "/permissions",
                icon: ShieldCheck,
                superadminOnly: true,
                featureKey: "permissions",
            },
            {
                label: ROLE_STRINGS.TITLE,
                path: "/roles",
                icon: ShieldCheck,
                superadminOnly: true,
                featureKey: "roles",
            },
            {
                label: COMPANY_STRINGS.NAV_COMPANIES,
                path: "/companies",
                icon: Building2,
                superadminOnly: true,
                featureKey: "companies",
            },
            {
                label: FEATURE_MODULE_STRINGS.NAV_ITEM,
                path: "/features",
                icon: LayoutList,
                superadminOnly: true,
                featureKey: "features",
            },
        ],
    },
];