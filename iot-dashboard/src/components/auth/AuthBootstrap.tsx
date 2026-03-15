// src/components/auth/AuthBootstrap.tsx
// Purpose of GET /auth/me: (1) Session check on every app load — "Do we already have a valid session?"
// (2) Rehydration — put the current user into the auth store so the UI reflects logged-in state.
// (3) Called even when the first route is /login: if the user has a session, public pages (LoginPage,
// SetPasswordPage) redirect to /. Runs once after Zustand rehydration. If 200 → set user; if 401/timeout
// → clear store and navigate to /login. Includes timeout and rehydration fallback so the app never hangs.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

const AUTH_CHECK_TIMEOUT_MS = 12_000;
const REHYDRATE_WAIT_MS = 1_500;

interface AuthBootstrapProps {
    children: React.ReactNode;
}

function runAuthCheck(onFailure: () => void): void {
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Auth check timeout")), AUTH_CHECK_TIMEOUT_MS)
    );

    Promise.race([getMe(), timeoutPromise])
        .then((me) => {
            useAuthStore.getState().setAuth(me.user, me.permissions);
            useAuthStore.getState().setAuthCheckDone(true);
        })
        .catch(() => {
            useAuthStore.getState().logout();
            useAuthStore.getState().setAuthCheckDone(true);
            onFailure();
        });
}

const AuthBootstrap = ({ children }: AuthBootstrapProps) => {
    const navigate = useNavigate();
    const rehydrated = useAuthStore((s) => s.rehydrated);
    const authCheckDone = useAuthStore((s) => s.authCheckDone);
    const hasRun = useRef(false);
    const [rehydrateTimedOut, setRehydrateTimedOut] = useState(false);

    // Allow auth check to run after rehydration OR after a short wait (in case rehydration never fires)
    const canRun = rehydrated || rehydrateTimedOut;

    useEffect(() => {
        const t = window.setTimeout(() => {
            setRehydrateTimedOut(true);
        }, REHYDRATE_WAIT_MS);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!canRun || authCheckDone || hasRun.current) return;

        hasRun.current = true;

        runAuthCheck(() => navigate("/login", { replace: true }));
    }, [canRun, authCheckDone, navigate]);

    return <>{children}</>;
};

export default AuthBootstrap;
