// src/routes/AppRouter.tsx
// Central route definitions — all routes are declared here only

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import DashboardLayout from "@/layouts/DashboardLayout";

// Lazy-loaded pages — keeps initial bundle small
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const FireExtinguisherPage = lazy(() => import("@/pages/modules/FireExtinguisherPage"));
const NodesPage = lazy(() => import("@/pages/modules/NodesPage"));
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
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected — all wrapped in DashboardLayout */}
                <Route element={<PrivateRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/fire-extinguisher" element={<FireExtinguisherPage />} />
                        <Route path="/devices" element={<NodesPage />} />
                        <Route path="/alerts" element={<AlertsPage />} />
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    </BrowserRouter>
);

export default AppRouter;