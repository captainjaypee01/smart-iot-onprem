// src/pages/dashboard/DashboardPage.tsx
// Overview dashboard — system-wide KPIs, module cards, faults table, temperature heatmap

import { Link } from "react-router-dom";
import {
    Cpu, Wifi, WifiOff, TriangleAlert, ArrowRight,
} from "lucide-react";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiCard from "@/components/shared/KpiCard";
import FaultsTable from "@/components/shared/FaultsTable";
import TemperatureHeatmap from "@/components/shared/TemperatureHeatmap";
import {
    useDashboardKpi,
    useOutstandingFaults,
    useHeatmap,
} from "@/hooks/useDashboard";
import { useFeatures } from "@/hooks/useFeatures";
import {
    DASHBOARD_STRINGS,
    FAULT_STRINGS,
    MODULE_META,
    MODULE,
} from "@/constants";

// ─── Module Summary Card ──────────────────────────────────────────
interface ModuleCardProps {
    label: string;
    shortLabel: string;
    description: string;
    path: string;
    totalNodes: number;
    onlineNodes: number;
    outstandingFaults: number;
    loading: boolean;
}

const ModuleCard = ({
    label, shortLabel, description, path,
    totalNodes, onlineNodes, outstandingFaults, loading,
}: ModuleCardProps) => (
    <Card className="flex flex-col">
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <CardTitle className="text-base">{label}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <span
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-white"
                    style={{ background: "linear-gradient(to right, #2a3f54, #0033cc)" }}
                >
                    {shortLabel}
                </span>
            </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
            {loading ? (
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p className="text-xl font-bold text-foreground">{totalNodes}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {onlineNodes}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Online</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-destructive">
                            {outstandingFaults}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Faults</p>
                    </div>
                </div>
            )}
            <Button
                variant="outline" size="sm"
                className="mt-auto gap-2 w-full"
                asChild
            >
                <Link to={path}>
                    {DASHBOARD_STRINGS.VIEW_ALL}
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </Button>
        </CardContent>
    </Card>
);

const DashboardEmpty = () => {
    // Users with no granted feature access should see a safe empty state.
    return <div className="flex flex-col gap-6" />;
};

const DashboardContent = () => {
    const { kpi, modules, loading: kpiLoading } = useDashboardKpi();
    const {
        faults, meta, page, setPage,
        loading: fLoading, error: fError, refresh: fRefresh,
    } = useOutstandingFaults();
    const {
        data: heatmap, loading: hLoading, error: hErr,
    } = useHeatmap();

    return (
        <div className="flex flex-col gap-6">

            {/* ── KPI Row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <KpiCard
                    label={DASHBOARD_STRINGS.TOTAL_NODES}
                    value={kpi?.total_nodes}
                    icon={Cpu}
                    iconClass="bg-brand-blue/10 text-brand-blue"
                    loading={kpiLoading}
                />
                <KpiCard
                    label={DASHBOARD_STRINGS.ONLINE_NODES}
                    value={kpi?.online_nodes}
                    icon={Wifi}
                    iconClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    loading={kpiLoading}
                />
                <KpiCard
                    label={DASHBOARD_STRINGS.OFFLINE_NODES}
                    value={kpi?.offline_nodes}
                    icon={WifiOff}
                    iconClass="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    loading={kpiLoading}
                />
                <KpiCard
                    label={DASHBOARD_STRINGS.OUTSTANDING_FAULTS}
                    value={kpi?.outstanding_faults}
                    icon={TriangleAlert}
                    iconClass="bg-destructive/10 text-destructive"
                    loading={kpiLoading}
                />
            </div>

            {/* ── Module Cards ─────────────────────────────────────── */}
            <div>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {DASHBOARD_STRINGS.MODULES_LABEL}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(() => {
                        const fe_meta = MODULE_META[MODULE.FIRE_EXTINGUISHER];
                        const mod = modules.find((m) => m.module === MODULE.FIRE_EXTINGUISHER);
                        return (
                            <ModuleCard
                                key={MODULE.FIRE_EXTINGUISHER}
                                label={fe_meta.label}
                                shortLabel={fe_meta.shortLabel}
                                description={fe_meta.description}
                                path={fe_meta.path}
                                totalNodes={mod?.total_nodes ?? 0}
                                onlineNodes={mod?.online_nodes ?? 0}
                                outstandingFaults={mod?.outstanding_faults ?? 0}
                                loading={kpiLoading}
                            />
                        );
                    })()}
                </div>
            </div>

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

                {/* Faults tab — no fault-type filter on overview (all modules) */}
                <TabsContent value="faults" className="mt-4">
                    <FaultsTable
                        faults={faults}
                        loading={fLoading}
                        error={fError}
                        onRefresh={fRefresh}
                        page={page}
                        totalPages={meta?.last_page ?? 1}
                        totalRecords={meta?.total}
                        onPage={setPage}
                    />
                </TabsContent>

                {/* Temperature heatmap — system-wide across all buildings */}
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

// ─── Page ─────────────────────────────────────────────────────────
const DashboardPage = () => {
    const { hasFeature } = useFeatures();

    // Current dashboard UI is Fire Extinguisher-based (faults + heatmap).
    // If the user has no access, keep the dashboard blank instead of
    // rendering module cards/links that would lead to 403.
    const canViewDashboard = hasFeature("dashboard");
    const canViewFireExtinguisher = hasFeature("fire-extinguisher");

    if (!canViewDashboard || !canViewFireExtinguisher) {
        return <DashboardEmpty />;
    }

    return <DashboardContent />;
};

export default DashboardPage;
