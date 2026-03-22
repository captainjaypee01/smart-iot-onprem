// src/hooks/useRoleNetworksOptions.ts
// Loads network options for the Role assignment dialog (superadmin only).

import { useCallback, useEffect, useState } from "react";
import { getNetworkOptions } from "@/api/networks";
import type { NetworkOption } from "@/types/network";
import { UI_STRINGS } from "@/constants/strings";

export interface UseRoleNetworksOptionsReturn {
    options: NetworkOption[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useRoleNetworksOptions = (
    enabled: boolean,
    companyId: number | null,
): UseRoleNetworksOptionsReturn => {
    const [options, setOptions] = useState<NetworkOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!enabled) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await getNetworkOptions(
                companyId == null ? undefined : companyId,
            );
            const active = res.data.filter((n) => n.is_active);
            setOptions(active);
        } catch {
            setError(UI_STRINGS.ERROR_GENERIC);
            setOptions([]);
        } finally {
            setIsLoading(false);
        }
    }, [enabled, companyId]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { options, isLoading, error, refetch };
};

