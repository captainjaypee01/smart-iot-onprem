// src/pages/auth/AuthCallbackPage.tsx
// Handles the redirect from the Laravel OAuth callback.
// Reads ?token=&user= from the URL, stores them, then navigates to dashboard.
// This page has no visible UI — it is purely a client-side handler.

import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { SSO_ERROR_MESSAGES, AUTH_STRINGS } from "@/constants/auth";
import type { User } from "@/types";

const AuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        // Prevent double-execution in React StrictMode
        if (handled.current) return;
        handled.current = true;

        const token = searchParams.get("token");
        const userEncoded = searchParams.get("user");
        const error = searchParams.get("error");

        // Handle SSO error redirects
        if (error) {
            const message =
                SSO_ERROR_MESSAGES[error] ?? "An unknown sign-in error occurred.";
            toast.error(message);
            navigate("/login", { replace: true });
            return;
        }

        // Validate required params
        if (!token || !userEncoded) {
            toast.error("Invalid callback. Please try signing in again.");
            navigate("/login", { replace: true });
            return;
        }

        try {
            const user: User = JSON.parse(atob(userEncoded));
            setAuth(user, token);

            // Clean the sensitive params from browser history
            window.history.replaceState({}, document.title, "/auth/callback");

            navigate("/dashboard", { replace: true });
        } catch {
            toast.error("Failed to complete sign-in. Please try again.");
            navigate("/login", { replace: true });
        }
    }, [searchParams, setAuth, navigate]);

    return (
        <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">
                {AUTH_STRINGS.callback.loading}
            </p>
        </div>
    );
};

export default AuthCallbackPage;
