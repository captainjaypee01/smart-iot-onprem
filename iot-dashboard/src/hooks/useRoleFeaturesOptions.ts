// src/hooks/useRoleFeaturesOptions.ts
// Loads grouped Feature options for the Role assignment dialog.

import { useCallback, useEffect, useState } from "react";
import { getFeatureOptions } from "@/api/features";
import type { FeatureGroup, FeaturesGroupedResponse } from "@/types/feature";
import { UI_STRINGS } from "@/constants/strings";

export interface UseRoleFeaturesOptionsReturn {
    groups: FeatureGroup[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useRoleFeaturesOptions = (
    enabled: boolean,
): UseRoleFeaturesOptionsReturn => {
    const [groups, setGroups] = useState<FeatureGroup[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!enabled) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await getFeatureOptions();
            const data: FeaturesGroupedResponse = res;
            setGroups(data.data);
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

