// src/pages/auth/LoginPage.tsx
// Public login page — authenticates user and redirects to dashboard

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Wifi, Moon, Sun, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { SSO_ERROR_MESSAGES } from "@/constants/auth";
import type { LoginCredentials } from "@/types";

// ─── SSO Provider Config ─────────────────────────────────────────
// Add or remove providers here as your backend supports them.
// Set enabled: false to render but disable a button during rollout.
interface SsoProvider {
    id: string;
    label: string;
    enabled: boolean;
    icon: React.ReactNode;
}

const SSO_PROVIDERS: SsoProvider[] = [
    {
        id: "microsoft",
        label: "Microsoft",
        enabled: true,   // flip to false to show "Coming soon" while Socialite is not ready
        icon: (
            <svg viewBox="0 0 21 21" className="h-4 w-4" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
        ),
    },
    {
        id: "google",
        label: "Google",
        enabled: false,   // flip to true when ready
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
        ),
    },
];

const LoginPage = () => {
    const { handleLogin, handleMicrosoftLogin, isLoading, isMicrosoftLoading, error } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [searchParams] = useSearchParams();

    const [credentials, setCredentials] = useState<LoginCredentials>({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    // Show SSO error messages that come back via ?error= from the Laravel callback
    useEffect(() => {
        const ssoError = searchParams.get("error");
        if (ssoError && SSO_ERROR_MESSAGES[ssoError]) {
            toast.error(SSO_ERROR_MESSAGES[ssoError]);
        }
    }, [searchParams]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleLogin(credentials);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Routes each SSO provider to its handler.
    // Add more cases here as you add providers to the backend.
    const handleSso = (providerId: string) => {
        if (providerId === "microsoft") {
            handleMicrosoftLogin();
            return;
        }
        // Fallback for future providers not yet wired to a dedicated handler
        window.location.href = `/api/v1/auth/${providerId}/redirect`;
    };

    const isFormDisabled = isLoading || isMicrosoftLoading;

    return (
        <div className="relative flex min-h-screen w-full">

            {/* ── Left Panel — Branding ───────────────────────────────── */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
                style={{ background: "linear-gradient(to bottom right, #2a3f54, #0033cc)" }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                        <Wifi className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-wide">
                        IoT Monitor
                    </span>
                </div>

                {/* Center copy */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold text-white leading-tight">
                            On-Premise IoT <br /> Monitoring Platform
                        </h1>
                        <p className="text-base text-blue-200 leading-relaxed max-w-sm">
                            Real-time visibility into your devices, alerts, and infrastructure —
                            all within your own network.
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2">
                        {["Real-time Monitoring", "MQTT Integration", "Custom Alerts", "Analytics"].map((f) => (
                            <span
                                key={f}
                                className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-white border border-white/20"
                            >
                                {f}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Bottom note */}
                <p className="text-sm text-blue-300">
                    On-premise deployment · Your data stays on your infrastructure
                </p>
            </div>

            {/* ── Right Panel — Login Form ─────────────────────────────── */}
            <div className="flex w-full lg:w-1/2 flex-col bg-background">

                {/* Theme toggle */}
                <div className="flex justify-end p-6">
                    <button
                        onClick={toggleTheme}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                            "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        aria-label="Toggle theme"
                    >
                        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </button>
                </div>

                {/* Form container */}
                <div className="flex flex-1 items-center justify-center px-6 pb-12">
                    <div className="w-full max-w-sm space-y-8">

                        {/* Mobile logo — only visible below lg */}
                        <div className="flex items-center gap-3 lg:hidden">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-lg"
                                style={{ background: "linear-gradient(to bottom right, #2a3f54, #0033cc)" }}
                            >
                                <Wifi className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-foreground">IoT Monitor</span>
                        </div>

                        {/* Heading */}
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                            <p className="text-sm text-muted-foreground">
                                Sign in to your account to continue
                            </p>
                        </div>

                        {/* Error banner — shows both login failures and SSO errors */}
                        {error && (
                            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* SSO Buttons — rendered only if at least one provider exists */}
                        {SSO_PROVIDERS.length > 0 && (
                            <div className="space-y-3">
                                {SSO_PROVIDERS.map((provider) => (
                                    <Button
                                        key={provider.id}
                                        type="button"
                                        variant="outline"
                                        disabled={!provider.enabled || isFormDisabled}
                                        onClick={() => handleSso(provider.id)}
                                        className="w-full h-11 gap-3 font-medium"
                                    >
                                        {/* Show spinner only on the button that is actively loading */}
                                        {provider.id === "microsoft" && isMicrosoftLoading
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : provider.icon
                                        }
                                        {provider.id === "microsoft" && isMicrosoftLoading
                                            ? "Redirecting to Microsoft..."
                                            : `Continue with ${provider.label}`
                                        }
                                        {!provider.enabled && (
                                            <span className="ml-auto text-xs text-muted-foreground font-normal">
                                                Coming soon
                                            </span>
                                        )}
                                    </Button>
                                ))}

                                {/* Divider */}
                                <div className="flex items-center gap-3 py-1">
                                    <Separator className="flex-1" />
                                    <span className="text-xs text-muted-foreground">
                                        or sign in with email
                                    </span>
                                    <Separator className="flex-1" />
                                </div>
                            </div>
                        )}

                        {/* Credentials Form */}
                        <form onSubmit={onSubmit} className="space-y-5">

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="you@company.com"
                                    value={credentials.email}
                                    onChange={onChange}
                                    disabled={isFormDisabled}
                                    className={cn(
                                        "h-11",
                                        error && "border-destructive focus-visible:ring-destructive"
                                    )}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        placeholder="••••••••"
                                        value={credentials.password}
                                        onChange={onChange}
                                        disabled={isFormDisabled}
                                        className={cn(
                                            "h-11 pr-11",
                                            error && "border-destructive focus-visible:ring-destructive"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword
                                            ? <EyeOff className="h-4 w-4" />
                                            : <Eye className="h-4 w-4" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={isFormDisabled}
                                className={cn(
                                    "w-full h-11 text-white font-semibold transition-opacity",
                                    "disabled:opacity-70"
                                )}
                                style={{ background: "linear-gradient(to right, #2a3f54, #0033cc)" }}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Signing in…
                                    </span>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </form>

                        {/* Footer note */}
                        <p className="text-center text-xs text-muted-foreground">
                            Access is restricted to authorized personnel only.
                            <br />
                            Contact your administrator if you need an account.
                        </p>
                    </div>
                </div>
            </div>

            {/* Theme-aware decorative corner gradient (desktop only) */}
            <div
                className="pointer-events-none absolute bottom-0 right-0 hidden h-64 w-64 lg:block opacity-5"
                style={{ background: "radial-gradient(circle, #0033cc, transparent)" }}
            />
        </div>
    );
};

export default LoginPage;