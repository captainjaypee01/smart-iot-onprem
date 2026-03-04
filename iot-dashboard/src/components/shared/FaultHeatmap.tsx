// src/components/shared/FaultHeatmap.tsx
// Fault heatmap — grouped by Building > Sector, color-coded by fault density

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    HEATMAP_STRINGS,
    HEATMAP_COLOR,
    getHeatmapLevel,
} from "@/constants";
import type { HeatmapBuilding } from "@/types/dashboard";

// ─── Legend ───────────────────────────────────────────────────────
const LEGEND = [
    { key: "NONE", label: HEATMAP_STRINGS.LEGEND_HEALTHY },
    { key: "LOW", label: HEATMAP_STRINGS.LEGEND_MONITOR },
    { key: "MEDIUM", label: HEATMAP_STRINGS.LEGEND_ATTENTION },
    { key: "HIGH", label: HEATMAP_STRINGS.LEGEND_CRITICAL },
    { key: "SEVERE", label: HEATMAP_STRINGS.LEGEND_SEVERE },
] as const;

// ─── Sector Cell ─────────────────────────────────────────────────
interface SectorCellProps {
    sector: string;
    faultCount: number;
    totalNodes: number;
}

const SectorCell = ({ sector, faultCount, totalNodes }: SectorCellProps) => {
    const level = getHeatmapLevel(faultCount);
    const colors = HEATMAP_COLOR[level];
    return (
        <div
            className={cn(
                "flex flex-col gap-1 rounded-lg border p-3 transition-colors",
                colors.bg,
                "border-transparent"
            )}
        >
            <p className={cn("text-xs font-semibold truncate", colors.text)}>
                {sector}
            </p>
            <p className={cn("text-lg font-bold leading-none", colors.text)}>
                {faultCount}
            </p>
            <p className="text-[10px] text-muted-foreground">
                {HEATMAP_STRINGS.NODES_IN_SECTOR(totalNodes)}
            </p>
        </div>
    );
};

// ─── Building Row ─────────────────────────────────────────────────
interface BuildingRowProps {
    building: HeatmapBuilding;
}

const BuildingRow = ({ building }: BuildingRowProps) => {
    const [open, setOpen] = useState(true);
    const level = getHeatmapLevel(building.fault_count);
    const colors = HEATMAP_COLOR[level];

    return (
        <div className="rounded-lg border border-border overflow-hidden">
            {/* Building header */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-3 bg-muted/50 px-4 py-3 hover:bg-muted transition-colors text-left"
            >
                {open
                    ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                }
                <span className="flex-1 font-semibold text-sm text-foreground">
                    {building.building}
                </span>
                <span className="text-xs text-muted-foreground mr-3">
                    {HEATMAP_STRINGS.NODES_IN_SECTOR(building.total_nodes)}
                </span>
                <Badge className={cn("text-xs", colors.bg, colors.text, "border-0")}>
                    {HEATMAP_STRINGS.FAULTS_COUNT(building.fault_count)}
                </Badge>
            </button>

            {/* Sector grid */}
            {open && (
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 bg-background">
                    {building.sectors.map((s) => (
                        <SectorCell
                            key={`${building.building}-${s.sector}`}
                            sector={s.sector}
                            faultCount={s.fault_count}
                            totalNodes={s.total_nodes}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────
interface FaultHeatmapProps {
    data: HeatmapBuilding[];
    loading: boolean;
    error: string | null;
}

const FaultHeatmap = ({ data, loading, error }: FaultHeatmapProps) => (
    <div className="flex flex-col gap-4">

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Legend:</span>
            {LEGEND.map((l) => (
                <div key={l.key} className="flex items-center gap-1.5">
                    <div className={cn("h-3 w-3 rounded-sm", HEATMAP_COLOR[l.key].bg)} />
                    <span className="text-xs text-muted-foreground">{l.label}</span>
                </div>
            ))}
        </div>

        {/* Error */}
        {error && (
            <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Skeleton */}
        {loading && (
            <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
            </div>
        )}

        {/* Buildings */}
        {!loading && data.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">{HEATMAP_STRINGS.NO_DATA}</p>
        )}

        {!loading && data.map((b) => (
            <BuildingRow key={b.building} building={b} />
        ))}
    </div>
);

export default FaultHeatmap;