// src/routes/AppRouter.tsx
// Central route definitions — all routes are declared here only

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthBootstrap from "@/components/auth/AuthBootstrap";
import PrivateRoute from "./PrivateRoute";
import DashboardLayout from "@/layouts/DashboardLayout";

// Lazy-loaded pages — keeps initial bundle small
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const AuthCallbackPage = lazy(() => import("@/pages/auth/AuthCallbackPage"));
const SetPasswordPage = lazy(() => import("@/pages/auth/SetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const FireExtinguisherPage = lazy(
    () => import("@/pages/modules/FireExtinguisherPage"),
);
const NodesPage = lazy(() => import("@/pages/nodes/NodesPage"));
const AlertsPage = lazy(() => import("@/pages/modules/AlertsPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const UsersPage = lazy(() => import("@/pages/users/UsersPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));
const PermissionsPage = lazy(
    () => import("@/pages/permissions/PermissionsPage"),
);

// Minimal fallback shown during lazy load
const PageLoader = () => (
    <div className="bg-background flex h-screen w-full items-center justify-center">
        <div className="border-brand-blue h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
);

const AppRouter = () => (
    <BrowserRouter>
        <AuthBootstrap>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* ── Public ──────────────────────────────────────────── */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Handles the redirect back from Microsoft OAuth */}
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />

                    {/* Invite link from welcome email — lets new users set a password */}
                    <Route path="/set-password" element={<SetPasswordPage />} />

                    {/* ── Protected — all wrapped in DashboardLayout ──────── */}
                    <Route element={<PrivateRoute />}>
                        <Route element={<DashboardLayout />}>
                            <Route path="/" element={<DashboardPage />} />
                            <Route
                                path="/fire-extinguisher"
                                element={<FireExtinguisherPage />}
                            />
                            <Route path="/nodes" element={<NodesPage />} />
                            <Route path="/alerts" element={<AlertsPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route
                                path="/permissions"
                                element={<PermissionsPage />}
                            />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                        </Route>
                    </Route>

                    {/* ── Fallback ─────────────────────────────────────────── */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </AuthBootstrap>
    </BrowserRouter>
);

export default AppRouter;
