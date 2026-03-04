// src/routes/PrivateRoute.tsx
// Guards protected routes — redirects to /login if not authenticated

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const PrivateRoute = () => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return !isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;