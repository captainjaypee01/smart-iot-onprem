// src/hooks/useRoles.ts
// Fetches roles for a company (dropdown). Re-fetches when companyId changes. No fetch when companyId is null.

import { useState, useCallback, useEffect } from "react";
import { getRolesByCompany } from "@/api/roles";
import type { Role } from "@/types/role";

export interface UseRolesReturn {
    roles: Role[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useRoles = (companyId: number | null): UseRolesReturn => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (companyId == null) {
            setRoles([]);
            setError(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await getRolesByCompany(companyId);
            setRoles(data);
        } catch {
            setError("Failed to load roles.");
            setRoles([]);
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { roles, isLoading, error, refetch };
};
