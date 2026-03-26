// src/hooks/useRoleNetworksOptions.ts
// Loads network options for the Role assignment form (superadmin only).
// When assigning a role to multiple companies, we union networks across all
// selected companies and dedupe by network id.

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
    companyIds: number[],
): UseRoleNetworksOptionsReturn => {
    const [options, setOptions] = useState<NetworkOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!enabled) {
            setOptions([]);
            setIsLoading(false);
            setError(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            if (companyIds.length === 0) {
                setOptions([]);
                return;
            }

            const responses = await Promise.all(
                companyIds.map((id) => getNetworkOptions(id)),
            );

            const flattened = responses.flatMap((r) => r.data);
            const byId = new Map<number, NetworkOption>();
            for (const n of flattened) {
                byId.set(n.id, n);
            }

            const active = Array.from(byId.values()).filter((n) => n.is_active);
            setOptions(active);
        } catch {
            setError(UI_STRINGS.ERROR_GENERIC);
            setOptions([]);
        } finally {
            setIsLoading(false);
        }
    }, [enabled, companyIds]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { options, isLoading, error, refetch };
};

