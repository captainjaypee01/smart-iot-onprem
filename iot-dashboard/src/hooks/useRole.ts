// src/hooks/useRole.ts
// Role checks from auth store — use for RBAC in UI (never hardcode role strings)

import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/user";

export interface UseRoleReturn {
    hasRole: (role: UserRole) => boolean;
    isAdmin: () => boolean;
    isSuperAdmin: () => boolean;
}

export const useRole = (): UseRoleReturn => {
    const user = useAuthStore((s) => s.user);

    const roleName = user?.role?.name ?? null;

    const hasRole = (role: UserRole): boolean => {
        if (!roleName) return false;
        return roleName.toLowerCase() === role.toLowerCase();
    };

    const isSuperAdmin = (): boolean => {
        return user?.is_superadmin === true;
    };

    const isAdmin = (): boolean => {
        return isSuperAdmin() || hasRole("admin");
    };

    return { hasRole, isAdmin, isSuperAdmin };
};
