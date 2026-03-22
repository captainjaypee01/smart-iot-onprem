// src/hooks/useRolePermissions.ts
// Permission helpers for the Role module UI

import { usePermission } from "@/hooks/usePermission";

export interface UseRolePermissionsReturn {
    canViewRoles: () => boolean;
    canCreateRole: () => boolean;
    canUpdateRole: () => boolean;
    canDeleteRole: () => boolean;
}

export const useRolePermissions = (): UseRolePermissionsReturn => {
    const { hasPermission } = usePermission();

    return {
        canViewRoles: () => hasPermission("role.view"),
        canCreateRole: () => hasPermission("role.create"),
        canUpdateRole: () => hasPermission("role.update"),
        canDeleteRole: () => hasPermission("role.delete"),
    };
};

