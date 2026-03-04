// src/components/shared/Sidebar.tsx
// Main sidebar — collapsible on desktop, drawer on mobile

import { Wifi, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebarStore";
import { NAV_GROUPS } from "@/config/nav";
import SidebarNavItem from "@/components/shared/SidebarNavItem";

// ─── Sidebar widths ────────────────────────────────────────────────
const W_EXPANDED = "w-64";
const W_COLLAPSED = "w-[68px]";

const Sidebar = () => {
    const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebarStore();

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
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin">
                    <div className="space-y-5 px-2">
                        {NAV_GROUPS.map((group) => (
                            <div key={group.title}>
                                {/* Group label — hidden when collapsed */}
                                {!isCollapsed && (
                                    <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                                        {group.title}
                                    </p>
                                )}
                                {isCollapsed && (
                                    <Separator className="mb-2 bg-white/10" />
                                )}
                                <ul className="space-y-0.5">
                                    {group.items.map((item) => (
                                        <li key={item.path}>
                                            <SidebarNavItem
                                                item={item}
                                                isCollapsed={isCollapsed}
                                                onClick={closeMobile}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </nav>

                {/* ── Collapse toggle (desktop only) ────────────────────── */}
                <div className="shrink-0 border-t border-white/10 p-2 hidden lg:block">
                    <button
                        onClick={toggle}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                            "text-white/60 hover:bg-white/10 hover:text-white transition-colors",
                            isCollapsed && "justify-center px-2"
                        )}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed
                            ? <ChevronsRight className="h-4 w-4 shrink-0" />
                            : <>
                                <ChevronsLeft className="h-4 w-4 shrink-0" />
                                <span className="text-sm font-medium">Collapse</span>
                            </>
                        }
                    </button>
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;