// src/pages/modules/FireExtinguisherPage.tsx
// Fire Extinguisher module — KPIs, fault breakdown (clickable filter), faults table, heatmap

import { useFeKpi, useFeFaults, useFeHeatmap } from "@/hooks/useFireExtinguisher";
import {
    Droplets, Thermometer, PackageX, EyeOff, AlertCircle,
    X, Flame, Cpu, TriangleAlert, Wifi, WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiCard from "@/components/shared/KpiCard";
import FaultsTable from "@/components/shared/FaultsTable";
import TemperatureHeatmap from "@/components/shared/TemperatureHeatmap";
import { FE_STRINGS, FAULT_STRINGS, FAULT_META, FAULT_TYPE } from "@/constants";
import type { FaultType } from "@/constants";
import { cn } from "@/lib/utils";

// ─── Breakdown item config ────────────────────────────────────────
const BREAKDOWN_ITEMS: { type: FaultType; icon: LucideIcon }[] = [
    { type: FAULT_TYPE.LEAK, icon: Droplets },
    { type: FAULT_TYPE.MISSING, icon: EyeOff },
    { type: FAULT_TYPE.BLOCKED, icon: PackageX },
    { type: FAULT_TYPE.FOREIGN_OBJECT, icon: AlertCircle },
    { type: FAULT_TYPE.HIGH_TEMPERATURE, icon: Thermometer },
    { type: FAULT_TYPE.LOW_TEMPERATURE, icon: Thermometer },
    { type: FAULT_TYPE.HIGH_HUMIDITY, icon: Droplets },
    { type: FAULT_TYPE.LOW_HUMIDITY, icon: Droplets },
];

// ─── Breakdown Card ───────────────────────────────────────────────
interface BreakdownCardProps {
    faultType: FaultType;
    icon: LucideIcon;
    count: number;
    loading: boolean;
    selected: boolean;
    onClick: (type: FaultType) => void;
}

const BreakdownCard = ({
    faultType, icon: Icon, count, loading, selected, onClick,
}: BreakdownCardProps) => {
    const meta = FAULT_META[faultType];
    const hasCount = count > 0;

    return (
        <button
            onClick={() => onClick(faultType)}
            disabled={loading}
            className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left w-full",
                "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                    ? "border-brand-blue ring-2 ring-brand-blue/30 bg-brand-blue/5 dark:bg-brand-blue/10"
                    : hasCount
                        ? cn("hover:border-brand-blue/40 hover:shadow-sm cursor-pointer", meta.colorClass)
                        : "bg-muted/30 border-border cursor-pointer hover:border-muted-foreground/30",
                !hasCount && !selected && "opacity-60",
            )}
            aria-pressed={selected}
        >
            <Icon className={cn(
                "h-4 w-4 shrink-0",
                selected ? "text-brand-blue" : hasCount ? meta.textClass : "text-muted-foreground"
            )} />
            <div className="min-w-0 flex-1">
                <p className={cn(
                    "text-xs font-medium truncate",
                    selected ? "text-brand-blue" : hasCount ? meta.textClass : "text-muted-foreground"
                )}>
                    {meta.label}
                </p>
            </div>
            {loading
                ? <Skeleton className="h-5 w-8 shrink-0" />
                : (
                    <Badge
                        variant={selected ? "default" : hasCount ? "destructive" : "secondary"}
                        className={cn("shrink-0 tabular-nums", selected && "bg-brand-blue")}
                    >
                        {count}
                    </Badge>
                )
            }
        </button>
    );
};

// ─── Page ─────────────────────────────────────────────────────────
const FireExtinguisherPage = () => {
    const { kpi, loading: kpiLoading } = useFeKpi();

    // ✅ Destructure faultTypes + setFaultTypes from the hook
    // These are the server-side filter — NOT local useState
    const {
        faults, meta, page, setPage,
        search, setSearch,
        faultTypes, setFaultTypes,       // ← this is the critical part
        loading: fLoading,
        error: fError,
        refresh: fRefresh,
    } = useFeFaults();

    const { data: heatmap, loading: hLoading, error: hErr } = useFeHeatmap();

    // Toggle a fault type in/out of the server-side filter
    const toggleFaultType = (type: FaultType) => {
        setFaultTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        );
    };

    const clearFilters = () => setFaultTypes([]);

    return (
        <div className="flex flex-col gap-6">

            {/* ── Page Header ──────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: "linear-gradient(to bottom right, #2a3f54, #0033cc)" }}
                >
                    <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-foreground">{FE_STRINGS.MODULE_TITLE}</h1>
                    <p className="text-xs text-muted-foreground">{FE_STRINGS.DASHBOARD_TITLE}</p>
                </div>
            </div>

            {/* ── KPI Row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <KpiCard label={FE_STRINGS.TOTAL_FE_NODES} value={kpi?.total_nodes} icon={Cpu} iconClass="bg-brand-blue/10 text-brand-blue" loading={kpiLoading} />
                <KpiCard label={FE_STRINGS.ACTIVE_FAULTS} value={kpi?.outstanding_faults} icon={TriangleAlert} iconClass="bg-destructive/10 text-destructive" loading={kpiLoading} />
                <KpiCard label="Online" value={kpi?.online_nodes} icon={Wifi} iconClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" loading={kpiLoading} />
                <KpiCard label="Offline" value={kpi?.offline_nodes} icon={WifiOff} iconClass="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" loading={kpiLoading} />
            </div>

            {/* ── Fault Breakdown (clickable multi-select filter) ───── */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-semibold">
                            {FE_STRINGS.ACTIVE_FAULTS} — Breakdown
                        </CardTitle>
                        {faultTypes.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                                Clear {faultTypes.length} filter{faultTypes.length > 1 ? "s" : ""}
                            </Button>
                        )}
                    </div>
                    {faultTypes.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            Click a fault type to filter the table below. Click multiple to combine filters.
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-4">
                        {BREAKDOWN_ITEMS.map(({ type, icon }) => (
                            <BreakdownCard
                                key={type}
                                faultType={type}
                                icon={icon}
                                count={kpi?.fault_breakdown?.[type] ?? 0}
                                loading={kpiLoading}
                                selected={faultTypes.includes(type)}  // ✅ reads from hook state
                                onClick={toggleFaultType}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ── Faults & Heatmap Tabs ─────────────────────────────── */}
            <Tabs defaultValue="faults">
                <TabsList>
                    <TabsTrigger value="faults" className="gap-2">
                        {FAULT_STRINGS.TABLE_TITLE}
                        {(kpi?.outstanding_faults ?? 0) > 0 && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                {kpi?.outstanding_faults}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="heatmap">
                        Temperature Heatmap
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="faults" className="mt-4">
                    <FaultsTable
                        faults={faults}
                        loading={fLoading}
                        error={fError}
                        showSearch
                        search={search}
                        onSearch={setSearch}
                        onRefresh={fRefresh}
                        activeFaultTypes={faultTypes}   // ✅ from hook, not local state
                        page={page}
                        totalPages={meta?.last_page ?? 1}
                        totalRecords={meta?.total}
                        onPage={setPage}
                    />
                </TabsContent>

                <TabsContent value="heatmap" className="mt-4">
                    <TemperatureHeatmap
                        data={heatmap}
                        loading={hLoading}
                        error={hErr}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FireExtinguisherPage;