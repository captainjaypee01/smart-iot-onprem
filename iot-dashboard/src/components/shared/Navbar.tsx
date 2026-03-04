// src/components/shared/Navbar.tsx
// Top navigation bar — breadcrumb, theme toggle, alerts bell, user menu

import { Menu, Sun, Moon, Bell, LogOut, User, ChevronDown } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAuth } from "@/hooks/useAuth";
import { NAV_GROUPS } from "@/config/nav";

// ─── Derive a breadcrumb label from the current path ──────────────
const usePageTitle = (): string => {
    const { pathname } = useLocation();
    for (const group of NAV_GROUPS) {
        const match = group.items.find((item) =>
            item.end ? pathname === item.path : pathname.startsWith(item.path)
        );
        if (match) return match.label;
    }
    return "Dashboard";
};

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const { openMobile } = useSidebarStore();
    const user = useAuthStore((s) => s.user);
    const { handleLogout } = useAuth();
    const pageTitle = usePageTitle();

    // Placeholder — wire to real alert count from your alerts store/API later
    const unreadAlerts = 0;

    return (
        <TooltipProvider>
            <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">

                {/* Mobile menu toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={openMobile}
                    aria-label="Open sidebar"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Page title / breadcrumb */}
                <div className="flex flex-1 items-center gap-2">
                    <h1 className="text-base font-semibold text-foreground">
                        {pageTitle}
                    </h1>
                </div>

                {/* Right-side actions */}
                <div className="flex items-center gap-1">

                    {/* Theme toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                            >
                                {theme === "light"
                                    ? <Moon className="h-[18px] w-[18px]" />
                                    : <Sun className="h-[18px] w-[18px]" />
                                }
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                        </TooltipContent>
                    </Tooltip>

                    {/* Alerts bell */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                                asChild
                            >
                                <Link to="/alerts" aria-label="View alerts">
                                    <Bell className="h-[18px] w-[18px]" />
                                    {unreadAlerts > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full px-1 text-[9px] font-bold"
                                        >
                                            {unreadAlerts > 99 ? "99+" : unreadAlerts}
                                        </Badge>
                                    )}
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Alerts</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="mx-1 h-6" />

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex h-9 items-center gap-2 px-2"
                                aria-label="User menu"
                            >
                                {/* Avatar initials */}
                                <div
                                    className={cn(
                                        "flex h-7 w-7 items-center justify-center rounded-full",
                                        "text-xs font-bold text-white"
                                    )}
                                    style={{ background: "linear-gradient(to bottom right, #2a3f54, #0033cc)" }}
                                >
                                    {user?.name
                                        ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                                        : "??"
                                    }
                                </div>
                                <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
                                    {user?.name ?? "User"}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-semibold text-foreground">
                                        {user?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user?.email}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                                        Role: {user?.role}
                                    </p>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                                    <User className="h-4 w-4" />
                                    Profile &amp; Settings
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </header>
        </TooltipProvider>
    );
};

export default Navbar;