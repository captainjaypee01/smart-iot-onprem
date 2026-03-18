// src/hooks/useNodeTypes.ts
// Custom hooks for Node Type list and options fetching.

import { useCallback, useEffect, useState } from "react";
import { getNodeTypes, getNodeTypeOptions, deleteNodeType } from "@/api/nodeTypes";
import type { NodeType, NodeTypeListResponse, NodeTypeOption } from "@/types/nodeType";

export interface UseNodeTypesParams {
    page: number;
    perPage: number;
    search?: string;
}

export interface UseNodeTypesReturn {
    nodeTypes: NodeType[];
    meta: NodeTypeListResponse["meta"] | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useNodeTypes = (params: UseNodeTypesParams): UseNodeTypesReturn => {
    const [data, setData] = useState<NodeTypeListResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getNodeTypes({
                page: params.page,
                per_page: params.perPage,
                search: params.search,
            });
            setData(response);
        } catch {
            setError("Failed to load node types.");
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [params.page, params.perPage, params.search]);

    useEffect(() => {
        void load();
    }, [load]);

    const refetch = useCallback(async () => {
        await load();
    }, [load]);

    return {
        nodeTypes: data?.data ?? [],
        meta: data?.meta ?? null,
        isLoading,
        error,
        refetch,
    };
};

export interface UseNodeTypeOptionsReturn {
    options: NodeTypeOption[];
    isLoading: boolean;
}

export const useNodeTypeOptions = (): UseNodeTypeOptionsReturn => {
    const [options, setOptions] = useState<NodeTypeOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const response = await getNodeTypeOptions();
                setOptions(response.data);
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, []);

    return { options, isLoading };
};

export const useDeleteNodeType = () => {
    const remove = useCallback(async (id: number): Promise<void> => {
        await deleteNodeType(id);
    }, []);

    return { deleteNodeType: remove };
};

