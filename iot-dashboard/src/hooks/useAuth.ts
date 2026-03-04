// src/hooks/useAuth.ts
// Handles login flow — calls API, updates Zustand store, redirects on success

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login, logout as logoutApi } from "@/api/auth";
import { mockLogin } from "@/mocks/handlers";
import { useAuthStore } from "@/store/authStore";
import type { LoginCredentials, ApiError } from "@/types";
import { AxiosError } from "axios";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

interface UseAuthReturn {
    isLoading: boolean;
    error: string | null;
    handleLogin: (credentials: LoginCredentials) => Promise<void>;
    handleLogout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setAuth = useAuthStore((s) => s.setAuth);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    const handleLogin = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);

        try {
            const { user, token } = USE_MOCK
                ? await mockLogin(credentials.email)
                : await login(credentials);
            setAuth(user, token);
            toast.success(`Welcome back, ${user.name}.`);
            navigate("/", { replace: true });
        } catch (err) {
            const axiosErr = err as AxiosError<ApiError>;
            const msg =
                axiosErr.response?.data?.message ??
                "Unable to connect. Please try again.";
            // Show inline error on the form AND a toast for visibility
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch {
            // Silently ignore — we always clear local state regardless
        } finally {
            logout();
            toast.info("You have been signed out.");
            navigate("/login", { replace: true });
        }
    };

    return { isLoading, error, handleLogin, handleLogout };
};