// src/hooks/useRoles.ts
// src/hooks/useRoles.ts
// Roles list/show hooks + dropdown options hook

import { useCallback, useEffect, useState } from "react";
import { getRole, getRoleOptions, getRoles } from "@/api/roles";
import { useAuthStore } from "@/store/authStore";
import type { Role, RoleListResponse, RoleOption } from "@/types/role";
import { UI_STRINGS } from "@/constants/strings";

export interface RolesQueryParams {
    page: number;
    per_page: number;
    search?: string;
    company_id?: number;
}

export interface UseRolesListReturn {
    roles: Role[];
    meta: RoleListResponse["meta"] | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useRoles = (params: RolesQueryParams): UseRolesListReturn => {
    const { page, per_page, search, company_id } = params;

    const [roles, setRoles] = useState<Role[]>([]);
    const [meta, setMeta] = useState<RoleListResponse["meta"] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getRoles({
                page,
                per_page,
                search: search?.trim() ? search.trim() : undefined,
                company_id,
            });
            setRoles(res.data);
            setMeta(res.meta);
        } catch {
            setError(UI_STRINGS.ERROR_GENERIC);
            setRoles([]);
            setMeta(null);
        } finally {
            setIsLoading(false);
        }
    }, [page, per_page, search, company_id]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { roles, meta, isLoading, error, refetch };
};

export interface UseRoleReturn {
    role: Role | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useRole = (id: number | null): UseRoleReturn => {
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (id == null) {
            setRole(null);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await getRole(id);
            setRole(res);
        } catch {
            setError(UI_STRINGS.ERROR_GENERIC);
            setRole(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { role, isLoading, error, refetch };
};

export interface UseRoleOptionsReturn {
    options: RoleOption[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useRoleOptions = (companyId?: number | null): UseRoleOptionsReturn => {
    const user = useAuthStore((s) => s.user);
    const isSuperAdmin = user?.is_superadmin ?? false;

    const [options, setOptions] = useState<RoleOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (isSuperAdmin && companyId == null) {
            setOptions([]);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await getRoleOptions(
                isSuperAdmin && companyId != null ? { company_id: companyId } : undefined,
            );
            setOptions(res.data);
        } catch {
            setError(UI_STRINGS.ERROR_GENERIC);
            setOptions([]);
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, companyId]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { options, isLoading, error, refetch };
};
