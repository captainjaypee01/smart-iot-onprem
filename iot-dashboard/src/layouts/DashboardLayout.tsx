// src/layouts/DashboardLayout.tsx
// Shell that wraps all protected pages — Sidebar + Navbar + page content

import { Outlet }          from "react-router-dom";
import { cn }              from "@/lib/utils";
import Sidebar             from "@/components/shared/Sidebar";
import Navbar              from "@/components/shared/Navbar";
import { useSidebarStore } from "@/store/sidebarStore";

const DashboardLayout = () => {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area — shifts right to make room for sidebar */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-in-out",
          // desktop: offset by sidebar width
          isCollapsed ? "lg:ml-[68px]" : "lg:ml-64",
          // mobile: no offset — sidebar overlays
          "ml-0"
        )}
      >
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;