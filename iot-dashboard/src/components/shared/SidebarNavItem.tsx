// src/components/shared/SidebarNavItem.tsx
// Single navigation item used inside the Sidebar

import { NavLink } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/nav";

interface SidebarNavItemProps {
    item: NavItem;
    isCollapsed: boolean;
    onClick?: () => void;
}

const SidebarNavItem = ({ item, isCollapsed, onClick }: SidebarNavItemProps) => {
    const Icon = item.icon;

    const linkContent = (
        <NavLink
            to={item.path}
            end={item.end}
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ml-2",
                    "transition-colors duration-150",
                    // inactive
                    "text-white/70 hover:bg-white/10 hover:text-white",
                    // active
                    isActive && "bg-white/15 text-white shadow-sm",
                    // collapsed — center the icon
                    isCollapsed && "justify-center px-2"
                )
            }
        >
            {/* <Icon className="h-[18px] w-[18px] shrink-0" /> */}

            {!isCollapsed && (
                <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {!!item.badge && item.badge > 0 && (
                        <Badge
                            variant="destructive"
                            className="h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold"
                        >
                            {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                    )}
                </>
            )}
        </NavLink>
    );

    // Show tooltip with label when sidebar is collapsed
    if (isCollapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {!!item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                            {item.badge}
                        </Badge>
                    )}
                </TooltipContent>
            </Tooltip>
        );
    }

    return linkContent;
};

export default SidebarNavItem;