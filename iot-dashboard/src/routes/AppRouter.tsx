// src/routes/AppRouter.tsx
// Central route definitions — all routes are declared here only

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

// Lazy-loaded pages — keeps initial bundle small
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const DevicesPage = lazy(() => import("@/pages/modules/DevicesPage"));
const AlertsPage = lazy(() => import("@/pages/modules/AlertsPage"));

// Minimal fallback shown during lazy load
const PageLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
    </div>
);

const AppRouter = () => (
    <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected routes */}
                <Route element={<PrivateRoute />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/devices" element={<DevicesPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                </Route>

                {/* Fallback — redirect unknown paths to root */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    </BrowserRouter>
);

export default AppRouter;