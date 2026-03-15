// src/hooks/useUserPermissions.ts
// User-module permission helpers — mirror API permission keys for consistent gating in UsersPage and EditDialog.
// API enforces authoritatively; these helpers drive UX (hide buttons/sections when not allowed).

import { usePermission } from "@/hooks/usePermission";

export interface UseUserPermissionsReturn {
    canViewUsers: () => boolean;
    canCreateUser: () => boolean;
    canUpdateUser: () => boolean;
    canDeleteUser: () => boolean;
    canDisableUser: () => boolean;
    canResendInvite: () => boolean;
    canChangeStatus: () => boolean;
    canChangeCompany: () => boolean;
}

export const useUserPermissions = (): UseUserPermissionsReturn => {
    const { hasPermission } = usePermission();

    return {
        canViewUsers: () => hasPermission("user.view"),
        canCreateUser: () => hasPermission("user.create"),
        canUpdateUser: () => hasPermission("user.update"),
        canDeleteUser: () => hasPermission("user.delete"),
        canDisableUser: () => hasPermission("user.disable"),
        canResendInvite: () => hasPermission("user.resend_invite"),
        canChangeStatus: () => hasPermission("user.change_status"),
        canChangeCompany: () => hasPermission("user.change_company"),
    };
};
