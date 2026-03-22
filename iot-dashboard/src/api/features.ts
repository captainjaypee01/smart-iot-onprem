// src/api/features.ts
// API functions for Feature module endpoints

import axiosClient from "./axiosClient";
import type {
    Feature,
    FeaturesGroupedResponse,
    CreateFeaturePayload,
    ReorderFeaturesPayload,
    ReorderGroupsPayload,
    UpdateFeaturePayload,
} from "@/types/feature";

export const getFeaturesGrouped = async (): Promise<FeaturesGroupedResponse> => {
    const res = await axiosClient.get<FeaturesGroupedResponse>("/v1/features");
    return res.data;
};

export const getFeatureOptions = async (): Promise<FeaturesGroupedResponse> => {
    const res = await axiosClient.get<FeaturesGroupedResponse>("/v1/features/options");
    return res.data;
};

export const updateFeature = async (
    id: number,
    payload: UpdateFeaturePayload,
): Promise<{ data: Feature }> => {
    const res = await axiosClient.put<{ data: Feature }>(`/v1/features/${id}`, payload);
    return res.data;
};

export const createFeature = async (
    payload: CreateFeaturePayload,
): Promise<Feature> => {
    const res = await axiosClient.post<Feature>("/v1/features", payload);
    return res.data;
};

export const deleteFeature = async (id: number): Promise<void> => {
    await axiosClient.delete(`/v1/features/${id}`);
};

export const reorderFeatures = async (
    payload: ReorderFeaturesPayload,
): Promise<FeaturesGroupedResponse> => {
    const res = await axiosClient.put<FeaturesGroupedResponse>("/v1/features/reorder", payload);
    return res.data;
};

export const reorderFeatureGroups = async (
    payload: ReorderGroupsPayload,
): Promise<FeaturesGroupedResponse> => {
    const res = await axiosClient.put<FeaturesGroupedResponse>(
        "/v1/features/reorder-groups",
        payload,
    );
    return res.data;
};

