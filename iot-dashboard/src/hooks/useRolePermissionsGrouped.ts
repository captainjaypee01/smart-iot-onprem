// src/hooks/useRolePermissionsGrouped.ts
// Loads grouped permissions for the Role assignment dialog.

import { useCallback, useEffect, useState } from "react";
import { getPermissionsGrouped } from "@/api/permissions";
import type { PermissionGroup, PermissionsGroupedResponse } from "@/types/permission";
import { UI_STRINGS } from "@/constants/strings";

export interface UseRolePermissionsGroupedReturn {
    groups: PermissionGroup[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useRolePermissionsGrouped = (
    enabled: boolean,
): UseRolePermissionsGroupedReturn => {
    const [groups, setGroups] = useState<PermissionGroup[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!enabled) return;
        setIsLoading(true);
        setError(null);
        try {
            const res: PermissionsGroupedResponse = await getPermissionsGrouped();
            setGroups(res.data);
        } catch {
            setError(UI_STRINGS.ERROR_GENERIC);
            setGroups([]);
        } finally {
            setIsLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { groups, isLoading, error, refetch };
};

