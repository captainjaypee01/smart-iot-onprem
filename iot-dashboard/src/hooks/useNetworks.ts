// src/hooks/useNetworks.ts
// Custom hooks for Network list, options, and address generation.

import { useCallback, useEffect, useState } from "react";
import {
    getNetworks,
    getNetworkOptions,
    generateNetworkAddress,
    deleteNetwork,
    toggleMaintenance,
} from "@/api/networks";
import type {
    Network,
    NetworkListResponse,
    NetworkOption,
} from "@/types/network";

export interface UseNetworksParams {
    page: number;
    perPage: number;
    search?: string;
    isActive?: boolean;
    isMaintenance?: boolean;
}

export interface UseNetworksReturn {
    networks: Network[];
    meta: NetworkListResponse["meta"] | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useNetworks = (params: UseNetworksParams): UseNetworksReturn => {
    const [data, setData] = useState<NetworkListResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getNetworks({
                page: params.page,
                per_page: params.perPage,
                search: params.search,
                is_active:
                    params.isActive === undefined ? undefined : params.isActive ? 1 : 0,
                is_maintenance:
                    params.isMaintenance === undefined
                        ? undefined
                        : params.isMaintenance
                        ? 1
                        : 0,
            });
            setData(response);
        } catch {
            setError("Failed to load networks.");
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [params.page, params.perPage, params.search, params.isActive, params.isMaintenance]);

    useEffect(() => {
        void load();
    }, [load]);

    const refetch = useCallback(async () => {
        await load();
    }, [load]);

    return {
        networks: data?.data ?? [],
        meta: data?.meta ?? null,
        isLoading,
        error,
        refetch,
    };
};

export interface UseNetworkOptionsReturn {
    options: NetworkOption[];
    isLoading: boolean;
    refetch: () => Promise<void>;
}

export const useNetworkOptions = (): UseNetworkOptionsReturn => {
    const [options, setOptions] = useState<NetworkOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getNetworkOptions();
            setOptions(response.data);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return { options, isLoading, refetch: load };
};

export interface UseGenerateAddressReturn {
    generate: () => Promise<string | null>;
    isGenerating: boolean;
}

export const useGenerateAddress = (): UseGenerateAddressReturn => {
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const generate = useCallback(async (): Promise<string | null> => {
        setIsGenerating(true);
        try {
            const response = await generateNetworkAddress();
            return response.data.network_address;
        } catch {
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return { generate, isGenerating };
};

export const useDeleteNetwork = () => {
    const remove = useCallback(async (id: number): Promise<void> => {
        await deleteNetwork(id);
    }, []);

    return { deleteNetwork: remove };
};

export interface UseToggleMaintenanceReturn {
    toggle: (
        id: number,
        payload: { is_maintenance: boolean; maintenance_start_at?: string | null; maintenance_end_at?: string | null },
    ) => Promise<Network>;
}

export const useToggleMaintenance = (): UseToggleMaintenanceReturn => {
    const toggle = useCallback(
        async (
            id: number,
            payload: {
                is_maintenance: boolean;
                maintenance_start_at?: string | null;
                maintenance_end_at?: string | null;
            },
        ): Promise<Network> => {
            const response = await toggleMaintenance(id, payload);
            return response.data;
        },
        [],
    );

    return { toggle };
};


