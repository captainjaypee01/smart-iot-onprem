// src/store/authStore.ts
// Global authentication state — cookie-based; user persisted to localStorage for quick rehydration

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    /** Set when the one-time session check (getMe) has run on app load. Not persisted. */
    authCheckDone: boolean;
    /** Set when persist has rehydrated from localStorage. Not persisted. */
    rehydrated: boolean;
    setAuth: (user: User) => void;
    logout: () => void;
    setAuthCheckDone: (done: boolean) => void;
    setRehydrated: (done: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            authCheckDone: false,
            rehydrated: false,

            setAuth: (user) => set({ user, isAuthenticated: true }),

            logout: () => set({ user: null, isAuthenticated: false }),

            setAuthCheckDone: (done) => set({ authCheckDone: done }),
            setRehydrated: (done) => set({ rehydrated: done }),
        }),
        {
            name: "iot-auth",
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => () => {
                useAuthStore.getState().setRehydrated(true);
            },
        }
    )
);