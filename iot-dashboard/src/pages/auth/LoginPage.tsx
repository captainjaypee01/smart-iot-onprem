// src/pages/auth/LoginPage.tsx
// Public login page — authenticates user and redirects to dashboard

import { useState } from "react";
import { Eye, EyeOff, Wifi, Moon, Sun, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import type { LoginCredentials } from "@/types";

const LoginPage = () => {
    const { handleLogin, isLoading, error } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [credentials, setCredentials] = useState<LoginCredentials>({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleLogin(credentials);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

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

                        {/* Error banner */}
                        {error && (
                            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Form */}
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
                                    disabled={isLoading}
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
                                        disabled={isLoading}
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
                                disabled={isLoading}
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