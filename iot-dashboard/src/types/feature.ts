// src/types/feature.ts
// Feature module types (Feature registry + role-access feature summaries)

export interface Feature {
    id: number;
    key: string;
    name: string;
    group: string;
    group_order: number;
    route: string;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    updated_at: string;
}

export interface FeatureGroup {
    group: string;
    label: string;
    features: Feature[];
}

export interface FeaturesGroupedResponse {
    data: FeatureGroup[];
}

export interface FeatureSummary {
    key: string;
    name: string;
    route: string;
    icon: string | null;
    group: string;
    group_order: number;
    sort_order: number;
}

export interface UpdateFeaturePayload {
    name?: string;
    icon?: string | null;
    sort_order?: number;
    is_active?: boolean;
}

export interface CreateFeaturePayload {
    key: string;
    name: string;
    group: string;
    group_order: number;
    route: string;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
}

export interface ReorderFeaturesPayload {
    features: { id: number; sort_order: number }[];
}

export interface ReorderGroupsPayload {
    groups: { group: string; group_order: number }[];
}

