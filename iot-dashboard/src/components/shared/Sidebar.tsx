// src/components/shared/Sidebar.tsx
// Main sidebar — collapsible on desktop, drawer on mobile

import { Wifi, X, ChevronDown, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebarStore";
import { useRole } from "@/hooks/useRole";
import { usePermission } from "@/hooks/usePermission";
import { useFeatures } from "@/hooks/useFeatures";
import { NAV_GROUPS } from "@/config/nav";
import { FEATURE_GROUP_STRINGS } from "@/constants/strings";
import SidebarNavItem from "@/components/shared/SidebarNavItem";
import type { FeatureSummary } from "@/types/feature";

// ─── Sidebar widths ────────────────────────────────────────────────
const W_EXPANDED = "w-64";
const W_COLLAPSED = "w-[68px]";

const Sidebar = () => {
    const { isCollapsed, isMobileOpen, closeMobile } = useSidebarStore();
    const { isAdmin, isSuperAdmin } = useRole();
    const { hasPermission } = usePermission();
    const { features, hasFeature } = useFeatures();
    const [collapsedByGroupKey, setCollapsedByGroupKey] = useState<Record<string, boolean>>({});

    const isItemVisible = (
        item: {
            adminOnly?: boolean;
            permission?: string;
            notSuperadmin?: boolean;
            superadminOnly?: boolean;
            featureKey?: string;
            accountOnly?: boolean;
            requiresFeatures?: boolean;
        },
    ) => {
        const hasFeatureInDynamic = (key: string): boolean =>
            features.some((f) => f.key === key);

        if (item.accountOnly) return true;
        if (item.requiresFeatures) {
            return isSuperAdmin() || features.length > 0;
        }

        if (item.superadminOnly) {
            // If the feature is already provided by the dynamic `/auth/me.features` path,
            // hide the static fallback to avoid duplicates.
            if (item.featureKey && hasFeatureInDynamic(item.featureKey)) {
                return false;
            }

            // Otherwise: show as fallback for true superadmin, or when a superadmin-equivalent
            // role is missing that featureKey in `/auth/me.features`.
            if (item.featureKey) {
                return isSuperAdmin();
            }

            return isSuperAdmin();
        }
        if (item.notSuperadmin && isSuperAdmin()) return false;
        if (item.permission) return hasPermission(item.permission);
        if (item.adminOnly) return isAdmin();
        if (item.featureKey) {
            return hasFeature(item.featureKey);
        }
        return false;
    };

    const getFeatureIcon = (iconName: string | null): LucideIcon => {
        if (!iconName) return Icons.Circle;

        const maybeIcon = (Icons as unknown as Record<string, unknown>)[iconName];
        if (typeof maybeIcon === "function") return maybeIcon as LucideIcon;

        return Icons.Circle;
    };

    const dynamicFeatureGroups = (() => {
        // Feature sidebar is driven exclusively by `/auth/me.features` (dynamic).
        // If a user has `group === "admin"` features, they will appear here.
        const eligible = features as FeatureSummary[];

        const sorted = [...eligible].sort(
            (a, b) => a.group_order - b.group_order || a.sort_order - b.sort_order,
        );

        const byGroup = new Map<
            string,
            { group: string; group_order: number; features: FeatureSummary[] }
        >();

        for (const f of sorted) {
            if (!byGroup.has(f.group)) {
                byGroup.set(f.group, {
                    group: f.group,
                    group_order: f.group_order,
                    features: [],
                });
            }
            byGroup.get(f.group)!.features.push(f);
        }

        return Array.from(byGroup.values()).sort((a, b) => a.group_order - b.group_order).map((g) => {
            const label =
                FEATURE_GROUP_STRINGS[g.group as keyof typeof FEATURE_GROUP_STRINGS] ??
                g.group;

            return {
                group: g.group,
                group_order: g.group_order,
                label,
                features: g.features,
            };
        });
    })();

    const toggleGroupCollapsed = (groupKey: string): void => {
        setCollapsedByGroupKey((prev) => ({
            ...prev,
            [groupKey]: !(prev[groupKey] ?? false),
        }));
    };

    return (
        <TooltipProvider>
            {/* ── Mobile overlay backdrop ──────────────────────────────── */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={closeMobile}
                    aria-hidden="true"
                />
            )}

            {/* ── Sidebar panel ───────────────────────────────────────── */}
            <aside
                className={cn(
                    // base
                    "fixed left-0 top-0 z-40 flex h-full flex-col",
                    "transition-[width] duration-300 ease-in-out",
                    // desktop width
                    isCollapsed ? W_COLLAPSED : W_EXPANDED,
                    // mobile: off-screen by default, slides in when open
                    "lg:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
                style={{ background: "linear-gradient(to bottom, #2a3f54, #0033cc)" }}
            >
                {/* ── Logo ──────────────────────────────────────────────── */}
                <div
                    className={cn(
                        "flex h-16 shrink-0 items-center border-b border-white/10",
                        isCollapsed ? "justify-center px-2" : "gap-3 px-4"
                    )}
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                        <Wifi className="h-5 w-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold text-white tracking-wide">
                                IoT Monitor
                            </span>
                            <span className="text-[10px] text-white/50 uppercase tracking-widest">
                                On-Premise
                            </span>
                        </div>
                    )}
                    {/* Mobile close button */}
                    <button
                        onClick={closeMobile}
                        className="ml-auto text-white/60 hover:text-white lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Nav groups ────────────────────────────────────────── */}
                <ScrollAreaPrimitive.Root className="flex-1 overflow-hidden" type="auto">
                    <ScrollAreaPrimitive.Viewport className="h-full w-full">
                        <nav className="overflow-x-hidden py-4">
                            <div className="space-y-5 px-2">
                                {dynamicFeatureGroups.length > 0 &&
                                    dynamicFeatureGroups.map((group) => (
                                        <div key={group.group}>
                                            {!isCollapsed ? (
                                                <button
                                                    type="button"
                                                    className="mb-1.5 flex w-full items-center gap-2 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-white/60"
                                                    onClick={() => toggleGroupCollapsed(group.group)}
                                                    aria-expanded={!(collapsedByGroupKey[group.group] ?? false)}
                                                >
                                                    {collapsedByGroupKey[group.group] ? (
                                                        <ChevronRight className="h-3 w-3 shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3 shrink-0" />
                                                    )}
                                                    <span>{group.label}</span>
                                                </button>
                                            ) : null}
                                            {isCollapsed && <Separator className="mb-2 bg-white/10" />}
                                            <ul className="space-y-0.5">
                                                {isCollapsed || !(collapsedByGroupKey[group.group] ?? false)
                                                    ? group.features.map((feature) => (
                                                          <li key={feature.key}>
                                                              <SidebarNavItem
                                                                  item={{
                                                                      label: feature.name,
                                                                      path: feature.route,
                                                                      icon: getFeatureIcon(feature.icon),
                                                                      end: true,
                                                                  }}
                                                                  isCollapsed={isCollapsed}
                                                                  onClick={closeMobile}
                                                              />
                                                          </li>
                                                      ))
                                                    : null}
                                            </ul>
                                        </div>
                                    ))}
                                {NAV_GROUPS.map((group) => {
                                    const visibleItems = group.items.filter((item) =>
                                        isItemVisible(item),
                                    );

                                    if (visibleItems.length === 0) return null;

                                    return (
                                        <div key={group.title}>
                                            {!isCollapsed ? (
                                                <button
                                                    type="button"
                                                    className="mb-1.5 flex w-full items-center gap-2 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-white/40 hover:text-white/60"
                                                    onClick={() =>
                                                        toggleGroupCollapsed(group.title)
                                                    }
                                                    aria-expanded={!(collapsedByGroupKey[group.title] ?? false)}
                                                >
                                                    {collapsedByGroupKey[group.title] ? (
                                                        <ChevronRight className="h-3 w-3 shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3 shrink-0" />
                                                    )}
                                                    <span>{group.title}</span>
                                                </button>
                                            ) : null}
                                            {isCollapsed ? <Separator className="mb-2 bg-white/10" /> : null}

                                            <ul className="space-y-0.5">
                                                {isCollapsed || !(collapsedByGroupKey[group.title] ?? false)
                                                    ? visibleItems.map((item) => (
                                                          <li key={item.path}>
                                                              <SidebarNavItem
                                                                  item={item}
                                                                  isCollapsed={isCollapsed}
                                                                  onClick={closeMobile}
                                                              />
                                                          </li>
                                                      ))
                                                    : null}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </nav>
                    </ScrollAreaPrimitive.Viewport>

                    <ScrollAreaPrimitive.ScrollAreaScrollbar orientation="vertical" className="w-2 p-0">
                        <ScrollAreaPrimitive.ScrollAreaThumb
                            className="relative flex-1 rounded-full bg-white/15 transition-colors data-[state=active]:bg-white/30"
                        />
                    </ScrollAreaPrimitive.ScrollAreaScrollbar>
                    <ScrollAreaPrimitive.Corner />
                </ScrollAreaPrimitive.Root>
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;