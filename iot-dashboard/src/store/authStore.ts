// src/store/authStore.ts
// Global authentication state — cookie-based; user and permissions for permission-based UI.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
    user: User | null;
    /** Permission keys (e.g. 'user.view', 'user.create'). Cleared on logout; set by setAuth. */
    permissions: string[];
    isAuthenticated: boolean;
    /** Set when the one-time session check (getMe) has run on app load. Not persisted. */
    authCheckDone: boolean;
    /** Set when persist has rehydrated from localStorage. Not persisted. */
    rehydrated: boolean;
    setAuth: (user: User, permissions?: string[]) => void;
    logout: () => void;
    setAuthCheckDone: (done: boolean) => void;
    setRehydrated: (done: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            permissions: [],
            isAuthenticated: false,
            authCheckDone: false,
            rehydrated: false,

            setAuth: (user, permissions = []) =>
                set({ user, permissions, isAuthenticated: true }),

            logout: () =>
                set({ user: null, permissions: [], isAuthenticated: false }),

            setAuthCheckDone: (done) => set({ authCheckDone: done }),
            setRehydrated: (done) => set({ rehydrated: done }),
        }),
        {
            name: "iot-auth",
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                permissions: state.permissions,
            }),
            onRehydrateStorage: () => () => {
                useAuthStore.getState().setRehydrated(true);
            },
        }
    )
);