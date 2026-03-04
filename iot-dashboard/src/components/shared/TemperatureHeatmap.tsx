// src/components/shared/TemperatureHeatmap.tsx
// Temperature heatmap — Building → Floor → Sector grid
// Cell color is interpolated from cool (blue) → warm (yellow) → hot (red)
// based on actual °C readings from Sensor 2 of each node

import { useState } from "react";
import { ChevronDown, ChevronRight, Thermometer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TempBuilding, TempSector } from "@/mocks/temperatureData";

// ─── Temperature color scale ──────────────────────────────────────
// Maps °C to an interpolated RGB color.
// < 20°C  → blue  (cold)
// 20-25°C → green (comfortable)
// 25-30°C → yellow (warm)
// 30-38°C → orange (hot)
// > 38°C  → red   (critical)

interface RGB { r: number; g: number; b: number }

const TEMP_STOPS: { temp: number; color: RGB }[] = [
    { temp: 15, color: { r: 59, g: 130, b: 246 } },  // blue-500
    { temp: 22, color: { r: 34, g: 197, b: 94 } },  // green-500
    { temp: 27, color: { r: 234, g: 179, b: 8 } },  // yellow-500
    { temp: 33, color: { r: 249, g: 115, b: 22 } },  // orange-500
    { temp: 38, color: { r: 239, g: 68, b: 68 } },  // red-500
    { temp: 45, color: { r: 127, g: 29, b: 29 } },  // red-900
];

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

const tempToColor = (temp: number): string => {
    const stops = TEMP_STOPS;
    if (temp <= stops[0].temp) {
        const c = stops[0].color;
        return `rgb(${c.r},${c.g},${c.b})`;
    }
    if (temp >= stops[stops.length - 1].temp) {
        const c = stops[stops.length - 1].color;
        return `rgb(${c.r},${c.g},${c.b})`;
    }
    for (let i = 0; i < stops.length - 1; i++) {
        if (temp >= stops[i].temp && temp <= stops[i + 1].temp) {
            const t = (temp - stops[i].temp) / (stops[i + 1].temp - stops[i].temp);
            const a = stops[i].color;
            const b = stops[i + 1].color;
            return `rgb(${lerp(a.r, b.r, t)},${lerp(a.g, b.g, t)},${lerp(a.b, b.b, t)})`;
        }
    }
    return "rgb(128,128,128)";
};

// White or black text depending on background brightness
const contrastColor = (temp: number): string => {
    const stops = TEMP_STOPS;
    let r = 128, g = 128, b = 128;
    if (temp <= stops[0].temp) { ({ r, g, b } = stops[0].color); }
    else if (temp >= stops[stops.length - 1].temp) {
        ({ r, g, b } = stops[stops.length - 1].color);
    } else {
        for (let i = 0; i < stops.length - 1; i++) {
            if (temp >= stops[i].temp && temp <= stops[i + 1].temp) {
                const t = (temp - stops[i].temp) / (stops[i + 1].temp - stops[i].temp);
                const a = stops[i].color; const bC = stops[i + 1].color;
                r = lerp(a.r, bC.r, t); g = lerp(a.g, bC.g, t); b = lerp(a.b, bC.b, t);
            }
        }
    }
    // Perceived luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum > 140 ? "#111" : "#fff";
};

// ─── Sector Cell ─────────────────────────────────────────────────
interface SectorCellProps { sector: TempSector }

const SectorCell = ({ sector }: SectorCellProps) => {
    const bg = tempToColor(sector.avg_temp);
    const text = contrastColor(sector.avg_temp);

    return (
        <TooltipProvider>
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                    <div
                        className="flex flex-col items-center justify-center rounded-lg p-2 cursor-default
                        transition-transform hover:scale-105 hover:shadow-md select-none"
                        style={{ backgroundColor: bg, color: text, minHeight: "72px" }}
                    >
                        <p className="text-[10px] font-semibold text-center leading-tight opacity-90 truncate w-full text-center">
                            {sector.sector}
                        </p>
                        <p className="text-lg font-bold leading-tight mt-0.5">
                            {sector.avg_temp}°
                        </p>
                        <p className="text-[9px] opacity-75">
                            {sector.node_count} node{sector.node_count !== 1 ? "s" : ""}
                        </p>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs space-y-1 p-3">
                    <p className="font-semibold">{sector.sector}</p>
                    <p>Avg: <span className="font-medium">{sector.avg_temp}°C</span></p>
                    <p>Min: <span className="font-medium">{sector.min_temp}°C</span></p>
                    <p>Max: <span className="font-medium">{sector.max_temp}°C</span></p>
                    <p>Nodes: <span className="font-medium">{sector.node_count}</span></p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

// ─── Floor Row ────────────────────────────────────────────────────
interface FloorRowProps {
    floor: string;
    avgTemp: number;
    sectors: TempSector[];
}

const FloorRow = ({ floor, avgTemp, sectors }: FloorRowProps) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-10 shrink-0">
                {floor}
            </span>
            <div className="grid grid-cols-3 gap-2 flex-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {sectors.map((s) => (
                    <SectorCell key={s.sector} sector={s} />
                ))}
            </div>
            <div
                className="shrink-0 rounded-md px-2 py-1 text-xs font-bold ml-2"
                style={{
                    backgroundColor: tempToColor(avgTemp),
                    color: contrastColor(avgTemp),
                }}
            >
                {avgTemp}°C
            </div>
        </div>
    </div>
);

// ─── Building Block ───────────────────────────────────────────────
interface BuildingBlockProps { building: TempBuilding }

const BuildingBlock = ({ building }: BuildingBlockProps) => {
    const [open, setOpen] = useState(true);

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
                    {building.floors.length} floor{building.floors.length !== 1 ? "s" : ""}
                    {" · "}
                    {building.floors.reduce((a, f) => a + f.sectors.reduce((b, s) => b + s.node_count, 0), 0)} nodes
                </span>
                <div
                    className="shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold"
                    style={{
                        backgroundColor: tempToColor(building.avg_temp),
                        color: contrastColor(building.avg_temp),
                    }}
                >
                    <Thermometer className="h-3 w-3" />
                    {building.avg_temp}°C avg
                </div>
            </button>

            {/* Floor rows */}
            {open && (
                <div className="flex flex-col gap-3 p-4 bg-background">
                    {building.floors.map((f) => (
                        <FloorRow
                            key={f.floor}
                            floor={f.floor}
                            avgTemp={f.avg_temp}
                            sectors={f.sectors}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Temperature Legend ───────────────────────────────────────────
const TemperatureLegend = () => {
    const steps = 20;
    const minT = TEMP_STOPS[0].temp;
    const maxT = TEMP_STOPS[TEMP_STOPS.length - 1].temp;

    return (
        <div className="flex flex-col gap-1">
            <div
                className="h-4 w-full rounded-md"
                style={{
                    background: `linear-gradient(to right, ${Array.from({ length: steps }, (_, i) => {
                        const t = minT + (i / (steps - 1)) * (maxT - minT);
                        return tempToColor(t);
                    }).join(", ")
                        })`,
                }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{minT}°C</span>
                <span>Cold → Comfortable → Warm → Hot → Critical</span>
                <span>{maxT}°C</span>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────
interface TemperatureHeatmapProps {
    data: TempBuilding[];
    loading: boolean;
    error: string | null;
}

const TemperatureHeatmap = ({ data, loading, error }: TemperatureHeatmapProps) => (
    <div className="flex flex-col gap-4">

        {/* Legend */}
        <TemperatureLegend />

        {/* Error */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Skeletons */}
        {loading && (
            <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))}
            </div>
        )}

        {/* Empty */}
        {!loading && !error && data.length === 0 && (
            <p className="text-sm text-muted-foreground">No temperature data available.</p>
        )}

        {/* Buildings */}
        {!loading && data.map((b) => (
            <BuildingBlock key={b.building} building={b} />
        ))}
    </div>
);

export default TemperatureHeatmap;