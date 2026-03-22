// src/lib/featureLucideIcon.ts
// Safe Lucide icon resolution by exported component name (FT-5 / feature-module-contract).

import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function getFeatureLucideIcon(iconName: string | null): LucideIcon {
    if (!iconName) return Icons.Circle;

    const maybe = (Icons as unknown as Record<string, unknown>)[iconName];
    if (typeof maybe === "function") return maybe as LucideIcon;

    return Icons.Circle;
}
