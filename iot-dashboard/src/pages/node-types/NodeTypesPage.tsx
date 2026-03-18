// src/pages/node-types/NodeTypesPage.tsx
// Node Types list page with search, pagination, and CRUD entry points.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { useNodeTypes, useDeleteNodeType } from "@/hooks/useNodeTypes";
import type { NodeType } from "@/types/nodeType";
import { NODE_TYPE_STRINGS, UI_STRINGS } from "@/constants/strings";
import NodeTypeFormDialog from "@/components/shared/NodeTypeFormDialog";

const DEFAULT_PER_PAGE = 15;
const SEARCH_DEBOUNCE_MS = 300;

const NodeTypesPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [pendingDelete, setPendingDelete] = useState<NodeType | null>(null);
    const [inUseIds, setInUseIds] = useState<Set<number>>(new Set());
    const [searchInput, setSearchInput] = useState<string>(
        searchParams.get("search") ?? "",
    );

    const initialPage = Number(searchParams.get("page") ?? "1");
    const initialPerPage = Number(searchParams.get("per_page") ?? DEFAULT_PER_PAGE);

    const [page, setPage] = useState<number>(Number.isNaN(initialPage) ? 1 : initialPage);
    const [perPage, setPerPage] = useState<number>(
        Number.isNaN(initialPerPage) ? DEFAULT_PER_PAGE : initialPerPage,
    );

    const search = searchParams.get("search") ?? undefined;

    const { nodeTypes, meta, isLoading, error, refetch } = useNodeTypes({
        page,
        perPage,
        search,
    });
    const { deleteNodeType } = useDeleteNodeType();
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [editing, setEditing] = useState<NodeType | undefined>(undefined);

    useEffect(() => {
        const handle = window.setTimeout(() => {
            const next = new URLSearchParams(searchParams);
            if (searchInput.trim()) {
                next.set("search", searchInput.trim());
                next.set("page", "1");
                setPage(1);
            } else {
                next.delete("search");
            }
            setSearchParams(next, { replace: true });
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(handle);
    }, [searchInput, searchParams, setSearchParams]);

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        next.set("page", String(page));
        next.set("per_page", String(perPage));
        setSearchParams(next, { replace: true });
    }, [page, perPage, searchParams, setSearchParams]);

    const canGoPrev = useMemo(
        () => (meta?.current_page ?? 1) > 1,
        [meta?.current_page],
    );

    const canGoNext = useMemo(
        () =>
            meta != null
                ? meta.current_page < meta.last_page
                : false,
        [meta],
    );

    const handleOpenCreate = useCallback(() => {
        setEditing(undefined);
        setDialogOpen(true);
    }, []);

    const handleOpenEdit = useCallback((nodeTypeToEdit: NodeType) => {
        setEditing(nodeTypeToEdit);
        setDialogOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(
        async (nodeType: NodeType) => {
            setPendingDelete(nodeType);
            setConfirmOpen(true);
        },
        [],
    );

    const handleDelete = useCallback(async () => {
        if (!pendingDelete) return;

        try {
            await deleteNodeType(pendingDelete.id);
            toast.success(NODE_TYPE_STRINGS.DELETE_SUCCESS);
            setConfirmOpen(false);
            setPendingDelete(null);
            await refetch();
        } catch (errorUnknown) {
            const errorMessage = NODE_TYPE_STRINGS.DELETE_ERROR;

            if (
                errorUnknown instanceof Error &&
                /409/.test(errorUnknown.message)
            ) {
                setInUseIds((prev) => new Set(prev).add(pendingDelete.id));
                toast.error(NODE_TYPE_STRINGS.IN_USE_TOOLTIP);
            } else {
                toast.error(errorMessage);
            }

            setConfirmOpen(false);
            setPendingDelete(null);
        }
    }, [deleteNodeType, pendingDelete, refetch]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-foreground">
                        {NODE_TYPE_STRINGS.TITLE}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                        {NODE_TYPE_STRINGS.SUBTITLE}
                    </p>
                </div>
                <Button onClick={handleOpenCreate}>
                    {NODE_TYPE_STRINGS.CREATE}
                </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={NODE_TYPE_STRINGS.SEARCH_PLACEHOLDER}
                    className="max-w-xs bg-background text-foreground dark:bg-background dark:text-foreground"
                />
            </div>

            {error && (
                <p className="text-sm text-destructive dark:text-destructive">
                    {NODE_TYPE_STRINGS.LOAD_ERROR}
                </p>
            )}

            <div className="overflow-x-auto rounded-md border border-border bg-card dark:bg-card">
                <table className="min-w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-border bg-muted/50 dark:bg-muted/50">
                            <th className="px-4 py-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                                {NODE_TYPE_STRINGS.NAME}
                            </th>
                            <th className="px-4 py-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                                {NODE_TYPE_STRINGS.AREA_ID}
                            </th>
                            <th className="px-4 py-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                                {NODE_TYPE_STRINGS.SENSORS}
                            </th>
                            <th className="px-4 py-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                                {NODE_TYPE_STRINGS.DESCRIPTION}
                            </th>
                            <th className="px-4 py-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground text-right">
                                {UI_STRINGS.ACTIONS}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-sm text-muted-foreground dark:text-muted-foreground"
                                >
                                    {UI_STRINGS.LOADING}
                                </td>
                            </tr>
                        ) : nodeTypes.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-sm text-muted-foreground dark:text-muted-foreground"
                                >
                                    {NODE_TYPE_STRINGS.EMPTY}
                                </td>
                            </tr>
                        ) : (
                            nodeTypes.map((nodeType) => {
                                const inUse = inUseIds.has(nodeType.id);
                                const sensorLabel =
                                    nodeType.sensor_count === 1
                                        ? NODE_TYPE_STRINGS.ONE_SENSOR
                                        : NODE_TYPE_STRINGS.SENSORS_COUNT.replace(
                                              "{count}",
                                              String(nodeType.sensor_count),
                                          );

                                const deleteButton = (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive dark:text-destructive"
                                        disabled={inUse}
                                        onClick={() => handleConfirmDelete(nodeType)}
                                    >
                                        {UI_STRINGS.DELETE}
                                    </Button>
                                );

                                return (
                                    <tr
                                        key={nodeType.id}
                                        className="border-b border-border last:border-b-0"
                                    >
                                        <td className="px-4 py-2 align-middle text-sm text-foreground dark:text-foreground">
                                            {nodeType.name}
                                        </td>
                                        <td className="px-4 py-2 align-middle text-sm">
                                            <Badge className="font-mono text-xs bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">
                                                {nodeType.area_id}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 align-middle text-sm text-foreground dark:text-foreground">
                                            {sensorLabel}
                                        </td>
                                        <td className="px-4 py-2 align-middle text-sm text-muted-foreground dark:text-muted-foreground">
                                            {nodeType.description ?? UI_STRINGS.N_A}
                                        </td>
                                        <td className="px-4 py-2 align-middle text-right text-sm">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(nodeType)}
                                                >
                                                    {UI_STRINGS.EDIT}
                                                </Button>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            {deleteButton}
                                                        </TooltipTrigger>
                                                        {inUse && (
                                                            <TooltipContent>
                                                                {
                                                                    NODE_TYPE_STRINGS.IN_USE_TOOLTIP
                                                                }
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {meta
                        ? NODE_TYPE_STRINGS.PAGINATION_SUMMARY.replace(
                              "{from}",
                              String(
                                  (meta.current_page - 1) * meta.per_page +
                                      (nodeTypes.length > 0 ? 1 : 0),
                              ),
                          )
                              .replace(
                                  "{to}",
                                  String(
                                      (meta.current_page - 1) * meta.per_page +
                                          nodeTypes.length,
                                  ),
                              )
                              .replace("{total}", String(meta.total))
                        : ""}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!canGoPrev}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                        {UI_STRINGS.PREV}
                    </Button>
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {meta ? `${meta.current_page} / ${meta.last_page}` : ""}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!canGoNext}
                        onClick={() => setPage((current) => current + 1)}
                    >
                        {UI_STRINGS.NEXT}
                    </Button>
                </div>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {NODE_TYPE_STRINGS.DELETE_CONFIRM_TITLE}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {NODE_TYPE_STRINGS.DELETE_CONFIRM_DESCRIPTION}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{UI_STRINGS.CANCEL}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                void handleDelete();
                            }}
                        >
                            {UI_STRINGS.DELETE}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <NodeTypeFormDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditing(undefined);
                    }
                    setDialogOpen(open);
                }}
                nodeType={editing}
                onSuccess={() => {
                    void refetch();
                }}
            />
        </div>
    );
};

export default NodeTypesPage;

