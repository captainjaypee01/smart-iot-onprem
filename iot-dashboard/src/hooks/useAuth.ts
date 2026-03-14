// src/hooks/useAuth.ts
// Handles login flow — calls API, updates Zustand store, redirects on success

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login, logout as logoutApi, getMicrosoftRedirectUrl } from "@/api/auth";
import { mockLogin } from "@/mocks/handlers";
import { useAuthStore } from "@/store/authStore";
import type { LoginCredentials, ApiError } from "@/types";
import { AxiosError } from "axios";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

interface UseAuthReturn {
    isLoading: boolean;
    isMicrosoftLoading: boolean;
    error: string | null;
    handleLogin: (credentials: LoginCredentials) => Promise<void>;
    handleLogout: () => Promise<void>;
    handleMicrosoftLogin: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setAuth = useAuthStore((s) => s.setAuth);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    const handleLogin = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);

        try {
            const { user } = USE_MOCK
                ? await mockLogin(credentials.email)
                : await login(credentials);
            setAuth(user);
            toast.success(`Welcome back, ${user.name}.`);
            navigate("/", { replace: true });
        } catch (err) {
            const axiosErr = err as AxiosError<ApiError>;
            const msg =
                axiosErr.response?.data?.message ??
                "Unable to connect. Please try again.";
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

    const handleMicrosoftLogin = async () => {
        // Mock mode has no SSO — fall back to a notice
        if (USE_MOCK) {
            toast.info("Microsoft SSO is not available in mock mode.");
            return;
        }

        setIsMicrosoftLoading(true);
        setError(null);

        try {
            const { redirect_url } = await getMicrosoftRedirectUrl();
            // Browser navigates away to Microsoft — no cleanup needed
            window.location.href = redirect_url;
        } catch {
            toast.error("Could not initiate Microsoft sign-in. Please try again.");
            setIsMicrosoftLoading(false);
        }
    };

    return { isLoading, isMicrosoftLoading, error, handleLogin, handleLogout, handleMicrosoftLogin };
};