// src/components/shared/KpiCard.tsx
// Reusable KPI summary card used on Dashboard and module pages

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    label: string;
    value: number | string | undefined;
    icon: LucideIcon;
    iconClass?: string;   // Tailwind color for the icon bg
    loading?: boolean;
    suffix?: string;
}

const KpiCard = ({
    label,
    value,
    icon: Icon,
    iconClass = "bg-brand-blue/10 text-brand-blue",
    loading = false,
    suffix,
}: KpiCardProps) => (
    <Card>
        <CardContent className="flex items-center gap-4 p-5">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", iconClass)}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
                {loading ? (
                    <Skeleton className="mt-1 h-7 w-20" />
                ) : (
                    <p className="text-2xl font-bold text-foreground leading-tight">
                        {value ?? "—"}
                        {suffix && (
                            <span className="ml-1 text-sm font-normal text-muted-foreground">
                                {suffix}
                            </span>
                        )}
                    </p>
                )}
            </div>
        </CardContent>
    </Card>
);

export default KpiCard;