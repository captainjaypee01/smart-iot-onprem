// src/hooks/useFeatures.ts
// Feature registry access helpers derived from /auth/me

import { useAuthStore } from "@/store/authStore";
import type { FeatureSummary } from "@/types/feature";

export const useFeatures = () => {
    const user = useAuthStore((s) => s.user);

    const hasFeature = (key: string): boolean => {
        if (user?.is_superadmin) return true;
        return user?.features?.some((f) => f.key === key) ?? false;
    };

    return {
        hasFeature,
        features: (user?.features ?? []) as FeatureSummary[],
    };
};

