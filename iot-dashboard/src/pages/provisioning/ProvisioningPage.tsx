// src/pages/provisioning/ProvisioningPage.tsx
// Superadmin-only page listing all provisioning batches with filters and pagination.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DataTableServer, type DataTableColumn } from "@/components/shared/DataTableServer";
import { useProvisioningBatches } from "@/hooks/useProvisioning";
import { useNetworkOptions } from "@/hooks/useNetworks";
import { PROVISIONING_STRINGS, UI_STRINGS } from "@/constants/strings";
import { cn } from "@/lib/utils";
import type { ProvisioningBatch, ProvisioningBatchStatus } from "@/types/provisioning";

const STATUS_ALL = "all";

const STATUS_BADGE_CLASSES: Record<ProvisioningBatchStatus, string> = {
    pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    partial:  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    complete: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    failed:   "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
} as const;

const STATUS_LABELS: Record<ProvisioningBatchStatus, string> = {
    pending:  PROVISIONING_STRINGS.STATUS_PENDING,
    partial:  PROVISIONING_STRINGS.STATUS_PARTIAL,
    complete: PROVISIONING_STRINGS.STATUS_COMPLETE,
    failed:   PROVISIONING_STRINGS.STATUS_FAILED,
} as const;

const STATUS_OPTIONS: ProvisioningBatchStatus[] = ["pending", "partial", "complete", "failed"];

const ProvisioningPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState<number>(1);
    const [networkId, setNetworkId] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState<ProvisioningBatchStatus | undefined>(undefined);

    const { options: networkOptions } = useNetworkOptions();

    const { batches, meta, isLoading, error, refetch } = useProvisioningBatches({
        page,
        per_page: 15,
        network_id: networkId,
        status,
    });

    const handleNewProvisioning = () => {
        const params = networkId !== undefined ? `?network_id=${networkId}` : "";
        navigate(`/provisioning/new${params}`);
    };

    const handleNetworkChange = (value: string) => {
        setNetworkId(value === STATUS_ALL ? undefined : Number(value));
        setPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value === STATUS_ALL ? undefined : (value as ProvisioningBatchStatus));
        setPage(1);
    };

    const columns: DataTableColumn<ProvisioningBatch>[] = [
        {
            id: "network",
            header: PROVISIONING_STRINGS.COL_NETWORK,
            cell: (row) => row.network.name,
        },
        {
            id: "submitted_by",
            header: PROVISIONING_STRINGS.COL_SUBMITTED_BY,
            cell: (row) => row.submitted_by?.name ?? UI_STRINGS.N_A,
        },
        {
            id: "created_at",
            header: PROVISIONING_STRINGS.COL_DATE,
            cell: (row) =>
                new Date(row.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                }),
        },
        {
            id: "total_nodes",
            header: PROVISIONING_STRINGS.COL_TOTAL_NODES,
            cell: (row) => row.total_nodes,
        },
        {
            id: "status_summary",
            header: PROVISIONING_STRINGS.COL_STATUS_SUMMARY,
            cell: (row) => row.status_summary,
        },
        {
            id: "status",
            header: PROVISIONING_STRINGS.COL_STATUS,
            cell: (row) => (
                <Badge
                    className={cn(
                        "text-xs capitalize",
                        STATUS_BADGE_CLASSES[row.status],
                    )}
                >
                    {STATUS_LABELS[row.status]}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: PROVISIONING_STRINGS.COL_ACTIONS,
            className: "text-right",
            cell: (row) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/provisioning/${row.id}`)}
                >
                    {PROVISIONING_STRINGS.VIEW}
                </Button>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {PROVISIONING_STRINGS.TITLE}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {PROVISIONING_STRINGS.SUBTITLE}
                    </p>
                </div>
                <Button onClick={handleNewProvisioning} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {PROVISIONING_STRINGS.NEW_PROVISIONING}
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    value={networkId !== undefined ? String(networkId) : STATUS_ALL}
                    onValueChange={handleNetworkChange}
                >
                    <SelectTrigger className="min-w-[180px]">
                        <SelectValue placeholder={PROVISIONING_STRINGS.FILTER_NETWORK_PLACEHOLDER} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={STATUS_ALL}>
                            {PROVISIONING_STRINGS.FILTER_NETWORK_PLACEHOLDER}
                        </SelectItem>
                        {networkOptions.map((opt) => (
                            <SelectItem key={opt.id} value={String(opt.id)}>
                                {opt.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={status ?? STATUS_ALL}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger className="min-w-[160px]">
                        <SelectValue placeholder={PROVISIONING_STRINGS.FILTER_STATUS_PLACEHOLDER} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={STATUS_ALL}>
                            {PROVISIONING_STRINGS.FILTER_STATUS_PLACEHOLDER}
                        </SelectItem>
                        {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => void refetch()}
                    aria-label={PROVISIONING_STRINGS.REFRESH}
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <DataTableServer<ProvisioningBatch>
                    columns={columns}
                    data={error !== null || isLoading ? [] : batches}
                    isLoading={isLoading}
                    emptyMessage={error !== null ? PROVISIONING_STRINGS.ERROR_LOAD : PROVISIONING_STRINGS.NO_BATCHES}
                    meta={meta}
                    page={page}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
};

export default ProvisioningPage;
