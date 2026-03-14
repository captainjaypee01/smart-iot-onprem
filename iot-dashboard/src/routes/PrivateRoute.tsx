// src/routes/PrivateRoute.tsx
// Guards protected routes — redirects to /login if not authenticated. Shows full-page loader while session is being validated on app load.

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const PageLoader = () => (
    <div className="bg-background flex h-screen w-full items-center justify-center">
        <div className="border-brand-blue h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
);

const PrivateRoute = () => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const authCheckDone = useAuthStore((s) => s.authCheckDone);

    if (!authCheckDone) {
        return <PageLoader />;
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;