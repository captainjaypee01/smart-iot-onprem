// src/pages/provisioning/ProvisioningDetailPage.tsx
// Superadmin-only detail view for a single provisioning batch and its nodes.

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useProvisioningBatch, useResendProvisioningNode } from "@/hooks/useProvisioning";
import { PROVISIONING_STRINGS, UI_STRINGS } from "@/constants/strings";
import { cn } from "@/lib/utils";
import type { ProvisioningBatchStatus, ProvisioningNodeStatus } from "@/types/provisioning";

// ─── Colour maps (typed exhaustively — no inline magic strings) ───────────────

const BATCH_STATUS_BADGE_CLASSES: Record<ProvisioningBatchStatus, string> = {
    pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    partial:  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    complete: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    failed:   "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
} as const;

const BATCH_STATUS_LABELS: Record<ProvisioningBatchStatus, string> = {
    pending:  PROVISIONING_STRINGS.STATUS_PENDING,
    partial:  PROVISIONING_STRINGS.STATUS_PARTIAL,
    complete: PROVISIONING_STRINGS.STATUS_COMPLETE,
    failed:   PROVISIONING_STRINGS.STATUS_FAILED,
} as const;

const NODE_STATUS_BADGE_CLASSES: Record<ProvisioningNodeStatus, string> = {
    pending:     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    provisioned: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    failed:      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
} as const;

const NODE_STATUS_LABELS: Record<ProvisioningNodeStatus, string> = {
    pending:     PROVISIONING_STRINGS.STATUS_PENDING,
    provisioned: PROVISIONING_STRINGS.STATUS_PROVISIONED,
    failed:      PROVISIONING_STRINGS.STATUS_FAILED,
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

const ProvisioningDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const batchId = Number(id);

    const { batch, isLoading, error, refetch } = useProvisioningBatch(batchId);
    const { resend } = useResendProvisioningNode();

    // Per-node loading state: Set<nodeId>
    const [resendingIds, setResendingIds] = useState<Set<number>>(new Set());

    const handleResend = async (nodeId: number, serviceId: string) => {
        setResendingIds((prev) => new Set(prev).add(nodeId));
        try {
            await resend(batchId, nodeId);
            toast.success(PROVISIONING_STRINGS.RESEND_SUCCESS(serviceId));
            await refetch();
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : PROVISIONING_STRINGS.ERROR_RESEND;
            toast.error(message);
        } finally {
            setResendingIds((prev) => {
                const next = new Set(prev);
                next.delete(nodeId);
                return next;
            });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Back button */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/provisioning" aria-label={PROVISIONING_STRINGS.BACK}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {PROVISIONING_STRINGS.TITLE}
                </h1>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {UI_STRINGS.LOADING}
                </div>
            )}

            {/* Error state */}
            {!isLoading && error !== null && (
                <p className="text-sm text-destructive">{PROVISIONING_STRINGS.ERROR_LOAD_DETAIL}</p>
            )}

            {/* Batch header card */}
            {!isLoading && batch !== null && (
                <>
                    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-medium text-card-foreground">
                                    {batch.network.name}
                                </p>
                                <p className="font-mono text-sm text-muted-foreground">
                                    {batch.network.network_address}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => void refetch()}
                                aria-label={PROVISIONING_STRINGS.REFRESH}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>

                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-0.5">
                                <dt className="text-xs text-muted-foreground">
                                    {PROVISIONING_STRINGS.COL_SUBMITTED_BY}
                                </dt>
                                <dd className="text-sm font-medium text-card-foreground">
                                    {batch.submitted_by?.name ?? PROVISIONING_STRINGS.SUBMITTED_BY_SYSTEM}
                                </dd>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <dt className="text-xs text-muted-foreground">
                                    {PROVISIONING_STRINGS.LABEL_SUBMITTED_DATE}
                                </dt>
                                <dd className="text-sm font-medium text-card-foreground">
                                    {new Date(batch.created_at).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </dd>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <dt className="text-xs text-muted-foreground">
                                    {PROVISIONING_STRINGS.COL_STATUS}
                                </dt>
                                <dd>
                                    <Badge
                                        className={cn(
                                            "text-xs capitalize",
                                            BATCH_STATUS_BADGE_CLASSES[batch.status],
                                        )}
                                    >
                                        {BATCH_STATUS_LABELS[batch.status]}
                                    </Badge>
                                </dd>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <dt className="text-xs text-muted-foreground">
                                    {PROVISIONING_STRINGS.COL_STATUS_SUMMARY}
                                </dt>
                                <dd className="text-sm font-medium text-card-foreground">
                                    {batch.status_summary}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Node table */}
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        {PROVISIONING_STRINGS.COL_NODE_NUMBER}
                                    </TableHead>
                                    <TableHead>{PROVISIONING_STRINGS.COL_SERVICE_ID}</TableHead>
                                    <TableHead>{PROVISIONING_STRINGS.COL_NODE_ADDRESS}</TableHead>
                                    <TableHead>{PROVISIONING_STRINGS.COL_STATUS}</TableHead>
                                    <TableHead className="text-right">
                                        {PROVISIONING_STRINGS.COL_ACTIONS}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(batch.nodes ?? []).map((node, index) => {
                                    const isResending = resendingIds.has(node.id);
                                    const canResend =
                                        node.status === "pending" || node.status === "failed";

                                    return (
                                        <TableRow key={node.id}>
                                            <TableCell className="text-muted-foreground">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {node.service_id}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {node.node_address}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={cn(
                                                        "text-xs capitalize",
                                                        NODE_STATUS_BADGE_CLASSES[node.status],
                                                    )}
                                                >
                                                    {NODE_STATUS_LABELS[node.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canResend && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isResending}
                                                        onClick={() =>
                                                            void handleResend(node.id, node.service_id)
                                                        }
                                                        className="gap-1.5"
                                                    >
                                                        {isResending && (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        )}
                                                        {isResending
                                                            ? PROVISIONING_STRINGS.RESENDING
                                                            : PROVISIONING_STRINGS.RESEND}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProvisioningDetailPage;
