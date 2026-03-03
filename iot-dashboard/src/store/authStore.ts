// src/store/authStore.ts
// Global authentication state — persisted to localStorage via Zustand

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) =>
                set({ user, token, isAuthenticated: true }),

            logout: () =>
                set({ user: null, token: null, isAuthenticated: false }),
        }),
        {
            name: "iot-auth",
            // Only persist token and user — not derived state
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);