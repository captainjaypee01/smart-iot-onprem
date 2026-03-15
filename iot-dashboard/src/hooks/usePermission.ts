// src/hooks/usePermission.ts
// Permission checks from auth store — use for permission-based UI (e.g. user.create, user.update).
// Superadmins receive all permission keys from the API, so hasPermission(key) is true for any key.

import { useAuthStore } from "@/store/authStore";

export interface UsePermissionReturn {
    /** True if the current user has the given permission key (e.g. 'user.view', 'user.create'). */
    hasPermission: (key: string) => boolean;
    /** All permission keys for the current user (empty when not loaded or logged out). */
    permissions: string[];
}

export const usePermission = (): UsePermissionReturn => {
    const permissions = useAuthStore((s) => s.permissions ?? []);

    const hasPermission = (key: string): boolean => {
        if (!key) return false;
        return permissions.includes(key);
    };

    return { hasPermission, permissions };
};
