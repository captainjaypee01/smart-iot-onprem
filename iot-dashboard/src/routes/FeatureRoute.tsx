// src/routes/FeatureRoute.tsx
// Client-side feature gate (mirrors /auth/me.feature registry)

import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useFeatures } from "@/hooks/useFeatures";

interface FeatureRouteProps {
    featureKey: string;
    children: ReactNode;
}

const FeatureRoute = ({ featureKey, children }: FeatureRouteProps) => {
    const { hasFeature } = useFeatures();

    if (!hasFeature(featureKey)) {
        return <Navigate to="/403" replace />;
    }

    return <>{children}</>;
};

export default FeatureRoute;

