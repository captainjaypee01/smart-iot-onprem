// src/pages/auth/AuthCallbackPage.tsx
// Handles the redirect from the Laravel OAuth callback (cookie-based).
// API has set the session cookie and redirected here. We call GET /auth/me to load user and go to dashboard.

import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getMe } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { SSO_ERROR_MESSAGES, AUTH_STRINGS } from "@/constants/auth";

const AuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const error = searchParams.get("error");

        if (error) {
            const message =
                SSO_ERROR_MESSAGES[error] ?? "An unknown sign-in error occurred.";
            toast.error(message);
            navigate("/login", { replace: true });
            return;
        }

        getMe()
            .then((user) => {
                setAuth(user);
                navigate("/dashboard", { replace: true });
            })
            .catch(() => {
                toast.error("Failed to complete sign-in. Please try again.");
                navigate("/login", { replace: true });
            });
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
