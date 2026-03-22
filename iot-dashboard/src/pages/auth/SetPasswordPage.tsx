// src/pages/auth/SetPasswordPage.tsx
// Shown when a new user clicks the invite link from their welcome email.
// Reads ?token=&email= from the URL and allows the user to set a password.

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetPassword } from "@/hooks/useSetPassword";
import { useAuthStore } from "@/store/authStore";
import { AUTH_FLOW_STRINGS } from "@/constants/auth";

const SetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isLoading, handleSetPassword } = useSetPassword();
    const authCheckDone = useAuthStore((s) => s.authCheckDone);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const token = searchParams.get("token") ?? "";
    const email = searchParams.get("email") ?? "";

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // If session check finished and user is already logged in, redirect to dashboard
    useEffect(() => {
        if (authCheckDone && isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [authCheckDone, isAuthenticated, navigate]);

    // Guard: if no token or email in URL, send to login
    if (!token || !email) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSetPassword({
            email,
            token,
            password,
            password_confirmation: passwordConfirmation,
        });
    };

    return (
        <div className="bg-background flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-8">
                {/* Header */}
                <div className="space-y-1">
                    <div className="bg-brand-blue mb-6 flex h-10 w-10 items-center justify-center rounded-lg">
                        <span className="text-sm font-bold text-white">IO</span>
                    </div>
                    <h2 className="text-foreground text-2xl font-bold tracking-tight">
                        {AUTH_FLOW_STRINGS.setPassword.title}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {AUTH_FLOW_STRINGS.setPassword.subtitle}
                    </p>
                </div>

                {/* Email (read-only context) */}
                <div className="border-border bg-muted/40 rounded-lg border px-4 py-3">
                    <p className="text-muted-foreground mb-0.5 text-xs">
                        Setting password for
                    </p>
                    <p className="text-foreground text-sm font-medium">{email}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {AUTH_FLOW_STRINGS.setPassword.passwordLabel}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={AUTH_FLOW_STRINGS.setPassword.passwordPlaceholder}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                minLength={8}
                                className="h-11 pr-10"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">
                            {AUTH_FLOW_STRINGS.setPassword.confirmLabel}
                        </Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type={showConfirm ? "text" : "password"}
                                placeholder={AUTH_FLOW_STRINGS.setPassword.confirmPlaceholder}
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                disabled={isLoading}
                                required
                                className="h-11 pr-10"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                                onClick={() => setShowConfirm((v) => !v)}
                                aria-label={showConfirm ? "Hide password" : "Show password"}
                            >
                                {showConfirm ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="h-11 w-full font-medium"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {AUTH_FLOW_STRINGS.setPassword.submittingButton}
                            </>
                        ) : (
                            AUTH_FLOW_STRINGS.setPassword.submitButton
                        )}
                    </Button>
                </form>

                <p className="text-muted-foreground text-center text-xs">
                    You can also use{" "}
                    <span className="text-foreground font-medium">Microsoft SSO</span> to
                    sign in without a password.
                </p>
            </div>
        </div>
    );
};

export default SetPasswordPage;
