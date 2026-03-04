
// src/components/shared/FaultsTable.tsx
// Faults table — server-side pagination, auto-refresh (30s), fault-type filter support

import { useEffect, useRef, useState } from "react";
import { Search, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    FAULT_STRINGS,
    FAULT_META,
    FAULT_SEVERITY,
    UI_STRINGS,
    POLL_INTERVAL_NORMAL,
    FAULTS_PAGE_SIZE,
} from "@/constants";
import type { Fault } from "@/types/dashboard";
import type { FaultType } from "@/constants";

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (iso: string): string =>
    new Date(iso).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
    });

const severityVariant = (
    s: string
): "destructive" | "default" | "secondary" => {
    if (s === FAULT_SEVERITY.CRITICAL) return "destructive";
    if (s === FAULT_SEVERITY.WARNING) return "default";
    return "secondary";
};

// ─── Countdown ticker ─────────────────────────────────────────────
const useCountdown = (totalMs: number, onTick: () => void) => {
    const [remaining, setRemaining] = useState(totalMs);
    const onTickRef = useRef(onTick);
    onTickRef.current = onTick;

    useEffect(() => {
        setRemaining(totalMs);
        const tick = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1000) {
                    onTickRef.current();
                    return totalMs;
                }
                return prev - 1000;
            });
        }, 1000);
        return () => clearInterval(tick);
    }, [totalMs]);

    return Math.ceil(remaining / 1000);
};

// ─── Props ────────────────────────────────────────────────────────
interface FaultsTableProps {
    faults: Fault[];
    loading: boolean;
    error: string | null;
    // search
    search?: string;
    onSearch?: (v: string) => void;
    showSearch?: boolean;
    // fault-type filter (controlled externally by breakdown cards)
    activeFaultTypes?: FaultType[];
    // refresh
    onRefresh: () => void;
    // server-side pagination
    page: number;
    totalPages: number;
    totalRecords?: number;
    onPage: (p: number) => void;
}

const SKELETON_ROWS = FAULTS_PAGE_SIZE;

// ─── Component ────────────────────────────────────────────────────
const FaultsTable = ({
    faults,
    loading,
    error,
    search = "",
    onSearch,
    showSearch = false,
    activeFaultTypes = [],
    onRefresh,
    page,
    totalPages,
    totalRecords,
    onPage,
}: FaultsTableProps) => {

    // Auto-refresh countdown — fires onRefresh every 30s
    const secsLeft = useCountdown(POLL_INTERVAL_NORMAL, onRefresh);

    // activeFaultTypes is display-only — actual filtering is done server-side in the hook
    const displayed = faults;

    return (
        <div className="flex flex-col gap-3">

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
                {showSearch && onSearch && (
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={FAULT_STRINGS.FILTER_PLACEHOLDER}
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {/* Active filter pills */}
                    {activeFaultTypes.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            Filtered: {activeFaultTypes.length} fault type{activeFaultTypes.length > 1 ? "s" : ""}
                        </span>
                    )}

                    {/* Countdown + refresh */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Refresh in {secsLeft}s</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={loading}
                        className="gap-2 h-9"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        {UI_STRINGS.REFRESH}
                    </Button>
                </div>
            </div>

            {/* ── Error ───────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* ── Table ───────────────────────────────────────────────── */}
            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">{FAULT_STRINGS.COL_NODE_NAME}</TableHead>
                            <TableHead className="font-semibold">{FAULT_STRINGS.COL_FAULT_DESC}</TableHead>
                            <TableHead className="font-semibold whitespace-nowrap">{FAULT_STRINGS.COL_FAULT_DATETIME}</TableHead>
                            <TableHead className="font-semibold">{FAULT_STRINGS.COL_LOCATION}</TableHead>
                            <TableHead className="font-semibold w-28">Severity</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : displayed.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                                    {activeFaultTypes.length > 0
                                        ? "No faults match the selected filter."
                                        : FAULT_STRINGS.NO_RECORDS}
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayed.map((fault) => {
                                const meta = FAULT_META[fault.fault_type];
                                return (
                                    <TableRow key={fault.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-foreground">
                                            {fault.node_name}
                                        </TableCell>
                                        <TableCell>
                                            {/* fault_type IS the description — label from FAULT_META */}
                                            <span className={cn("text-sm font-medium", meta.textClass)}>
                                                {meta.label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {fmt(fault.fault_datetime)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {fault.location}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={severityVariant(fault.severity)}>
                                                {fault.severity}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Pagination ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                    {totalRecords !== undefined
                        ? `${totalRecords} record${totalRecords !== 1 ? "s" : ""} total`
                        : ""}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline" size="sm"
                        disabled={page <= 1 || loading}
                        onClick={() => onPage(1)}
                    >
                        «
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        disabled={page <= 1 || loading}
                        onClick={() => onPage(page - 1)}
                    >
                        {UI_STRINGS.PREVIOUS}
                    </Button>
                    <span className="min-w-[80px] text-center text-sm text-muted-foreground">
                        Page {page} of {totalPages || 1}
                    </span>
                    <Button
                        variant="outline" size="sm"
                        disabled={page >= totalPages || loading}
                        onClick={() => onPage(page + 1)}
                    >
                        {UI_STRINGS.NEXT}
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        disabled={page >= totalPages || loading}
                        onClick={() => onPage(totalPages)}
                    >
                        »
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FaultsTable;