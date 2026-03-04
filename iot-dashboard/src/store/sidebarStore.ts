// src/store/sidebarStore.ts
// Controls sidebar collapsed/expanded state — persisted per user preference

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    toggle: () => void;
    setCollapsed: (val: boolean) => void;
    openMobile: () => void;
    closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isCollapsed: false,
            isMobileOpen: false,

            toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
            setCollapsed: (val) => set({ isCollapsed: val }),
            openMobile: () => set({ isMobileOpen: true }),
            closeMobile: () => set({ isMobileOpen: false }),
        }),
        {
            name: "iot-sidebar",
            partialize: (s) => ({ isCollapsed: s.isCollapsed }),
        }
    )
);