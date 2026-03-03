// src/hooks/useAuth.ts
// Handles login flow — calls API, updates Zustand store, redirects on success

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import type { LoginCredentials, ApiError } from "@/types";
import { AxiosError } from "axios";

interface UseAuthReturn {
    isLoading: boolean;
    error: string | null;
    handleLogin: (credentials: LoginCredentials) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setAuth = useAuthStore((s) => s.setAuth);
    const navigate = useNavigate();

    const handleLogin = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);

        try {
            const { user, token } = await login(credentials);
            setAuth(user, token);
            navigate("/", { replace: true });
        } catch (err) {
            const axiosErr = err as AxiosError<ApiError>;
            const msg =
                axiosErr.response?.data?.message ??
                "Unable to connect. Please try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, error, handleLogin };
};