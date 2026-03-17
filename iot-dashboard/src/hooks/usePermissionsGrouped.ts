// src/hooks/usePermissionsGrouped.ts
// Fetches grouped permissions for Access Control / Role assignment UIs.

import { useCallback, useEffect, useState } from "react";
import { getPermissionsGrouped } from "@/api/permissions";
import type { PermissionGroup } from "@/types/permission";

export interface UsePermissionsGroupedReturn {
    groups: PermissionGroup[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const usePermissionsGrouped = (): UsePermissionsGroupedReturn => {
    const [groups, setGroups] = useState<PermissionGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getPermissionsGrouped();
            setGroups(res.data);
        } catch {
            setError("Failed to load permissions.");
            setGroups([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { groups, isLoading, error, refetch };
};

