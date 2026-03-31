// src/routes/AppRouter.tsx
// Central route definitions — all routes are declared here only

import { lazy, Suspense } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Outlet,
} from "react-router-dom";
import AuthBootstrap from "@/components/auth/AuthBootstrap";
import PrivateRoute from "./PrivateRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useRole } from "@/hooks/useRole";
import FeatureRoute from "@/routes/FeatureRoute";

// Lazy-loaded pages — keeps initial bundle small
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const AuthCallbackPage = lazy(() => import("@/pages/auth/AuthCallbackPage"));
const SetPasswordPage = lazy(() => import("@/pages/auth/SetPasswordPage"));
const ForbiddenPage = lazy(() => import("@/pages/errors/ForbiddenPage"));
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
const NodeTypesPage = lazy(() => import("@/pages/node-types/NodeTypesPage"));
const NetworksPage = lazy(() => import("@/pages/networks/NetworksPage"));
const CompaniesPage = lazy(() => import("@/pages/companies/CompaniesPage"));
const CompanySettingsPage = lazy(
    () => import("@/pages/settings/CompanySettingsPage"),
);
const FeaturesPage = lazy(() => import("@/pages/features/FeaturesPage"));
const RolesPage = lazy(() => import("@/pages/roles/RolesPage"));
const RoleFormPage = lazy(() => import("@/pages/roles/RoleFormPage"));
const ProvisioningPage = lazy(() => import("@/pages/provisioning/ProvisioningPage"));
const NewProvisioningPage = lazy(() => import("@/pages/provisioning/NewProvisioningPage"));
const ProvisioningDetailPage = lazy(() => import("@/pages/provisioning/ProvisioningDetailPage"));

// Minimal fallback shown during lazy load
const PageLoader = () => (
    <div className="bg-background flex h-screen w-full items-center justify-center">
        <div className="border-brand-blue h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
);

const SuperadminOutlet = () => {
    const { isSuperAdmin } = useRole();
    return isSuperAdmin() ? <Outlet /> : <Navigate to="/" replace />;
};

const CompanyAdminOutlet = () => {
    const { isSuperAdmin } = useRole();
    return !isSuperAdmin() ? <Outlet /> : <Navigate to="/settings" replace />;
};

/** Session duration / app settings — superadmin + company admins only (see `useRole().isAdmin`). */
const SessionSettingsRoute = () => {
    const { isAdmin } = useRole();
    if (!isAdmin()) return <Navigate to="/" replace />;
    return <SettingsPage />;
};

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
                            <Route
                                path="/fire-extinguisher"
                                element={
                                    <FeatureRoute featureKey="fire-extinguisher">
                                        <FireExtinguisherPage />
                                    </FeatureRoute>
                                }
                            />
                            <Route
                                path="/nodes"
                                element={
                                    <FeatureRoute featureKey="nodes">
                                        <NodesPage />
                                    </FeatureRoute>
                                }
                            />
                            <Route
                                path="/alerts"
                                element={
                                    <FeatureRoute featureKey="alerts">
                                        <AlertsPage />
                                    </FeatureRoute>
                                }
                            />
                            <Route
                                path="/dashboard"
                                element={<DashboardPage />}
                            />
                            <Route
                                path="/"
                                element={<DashboardPage />}
                            />
                            <Route path="/settings" element={<SessionSettingsRoute />} />
                            <Route
                                path="/users"
                                element={
                                    <FeatureRoute featureKey="users">
                                        <UsersPage />
                                    </FeatureRoute>
                                }
                            />
                            <Route path="/profile" element={<ProfilePage />} />
                            {/* Always available within the authenticated app */}
                            <Route path="/403" element={<ForbiddenPage />} />
                            <Route element={<SuperadminOutlet />}>
                                <Route
                                    path="/networks"
                                    element={<NetworksPage />}
                                />
                                <Route
                                    path="/permissions"
                                    element={<PermissionsPage />}
                                />
                                <Route
                                    path="/node-types"
                                    element={<NodeTypesPage />}
                                />
                                <Route
                                    path="/companies"
                                    element={<CompaniesPage />}
                                />
                                <Route path="/features" element={<FeaturesPage />} />
                                {/* Role management — superadmin-only in SPA; tenant-delegated RBAC TBD */}
                                <Route path="/roles" element={<RolesPage />} />
                                <Route path="/roles/create" element={<RoleFormPage />} />
                                <Route path="/roles/:id/edit" element={<RoleFormPage />} />
                                <Route path="/provisioning" element={<ProvisioningPage />} />
                                <Route path="/provisioning/new" element={<NewProvisioningPage />} />
                                <Route path="/provisioning/:id" element={<ProvisioningDetailPage />} />
                            </Route>
                            <Route element={<CompanyAdminOutlet />}>
                                <Route
                                    path="/settings/company"
                                    element={
                                        <FeatureRoute featureKey="company-settings">
                                            <CompanySettingsPage />
                                        </FeatureRoute>
                                    }
                                />
                            </Route>
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
