// src/hooks/useFeatureAdmin.ts
// Superadmin Feature registry — data load + mutation hooks (API via src/api/features.ts)

import { useCallback, useEffect, useState } from "react";
import {
    getFeaturesGrouped,
    reorderFeatureGroups,
    reorderFeatures,
    createFeature,
    deleteFeature,
    updateFeature,
} from "@/api/features";
import type {
    Feature,
    FeatureGroup,
    FeaturesGroupedResponse,
    CreateFeaturePayload,
    ReorderFeaturesPayload,
    ReorderGroupsPayload,
    UpdateFeaturePayload,
} from "@/types/feature";

export interface UseFeatureAdminResult {
    groups: FeatureGroup[];
    isLoading: boolean;
    refetch: () => Promise<void>;
}

export function useFeatureAdmin(): UseFeatureAdminResult {
    const [groups, setGroups] = useState<FeatureGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getFeaturesGrouped();
            setGroups(res.data);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { groups, isLoading, refetch };
}

export interface UseUpdateFeatureResult {
    mutate: (id: number, payload: UpdateFeaturePayload) => Promise<{ data: Feature }>;
    isSubmitting: boolean;
}

export function useUpdateFeature(): UseUpdateFeatureResult {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mutate = useCallback(async (id: number, payload: UpdateFeaturePayload) => {
        setIsSubmitting(true);
        try {
            return await updateFeature(id, payload);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { mutate, isSubmitting };
}

export interface UseCreateFeatureResult {
    mutate: (payload: CreateFeaturePayload) => Promise<Feature>;
    isSubmitting: boolean;
}

export function useCreateFeature(): UseCreateFeatureResult {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mutate = useCallback(async (payload: CreateFeaturePayload) => {
        setIsSubmitting(true);
        try {
            return await createFeature(payload);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { mutate, isSubmitting };
}

export interface UseDeleteFeatureResult {
    deleteFeature: (id: number) => Promise<void>;
    isDeleting: boolean;
}

export function useDeleteFeature(): UseDeleteFeatureResult {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteFeatureMutate = useCallback(async (id: number) => {
        setIsDeleting(true);
        try {
            await deleteFeature(id);
        } finally {
            setIsDeleting(false);
        }
    }, []);

    return { deleteFeature: deleteFeatureMutate, isDeleting };
}

export interface UseReorderFeaturesResult {
    mutate: (payload: ReorderFeaturesPayload) => Promise<FeaturesGroupedResponse>;
    isReordering: boolean;
}

export function useReorderFeatures(): UseReorderFeaturesResult {
    const [isReordering, setIsReordering] = useState(false);

    const mutate = useCallback(async (payload: ReorderFeaturesPayload) => {
        setIsReordering(true);
        try {
            return await reorderFeatures(payload);
        } finally {
            setIsReordering(false);
        }
    }, []);

    return { mutate, isReordering };
}

export interface UseReorderFeatureGroupsResult {
    mutate: (payload: ReorderGroupsPayload) => Promise<FeaturesGroupedResponse>;
    isReordering: boolean;
}

export function useReorderFeatureGroups(): UseReorderFeatureGroupsResult {
    const [isReordering, setIsReordering] = useState(false);

    const mutate = useCallback(async (payload: ReorderGroupsPayload) => {
        setIsReordering(true);
        try {
            return await reorderFeatureGroups(payload);
        } finally {
            setIsReordering(false);
        }
    }, []);

    return { mutate, isReordering };
}
