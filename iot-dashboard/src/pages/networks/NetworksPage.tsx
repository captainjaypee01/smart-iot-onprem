// src/pages/networks/NetworksPage.tsx
// Networks listing page — filters, paginated table, basic CRUD actions (placeholder dialog).

import { useState } from "react";
import { useNetworks, useDeleteNetwork } from "@/hooks/useNetworks";
import type { Network } from "@/types/network";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { NETWORK_STRINGS, UI_STRINGS } from "@/constants/strings";
import { toast } from "sonner";
import { Plus, Search, Edit3, Trash2, Wrench } from "lucide-react";
import ToggleMaintenanceDialog from "@/components/shared/ToggleMaintenanceDialog";
import NetworkFormDialog from "@/components/shared/NetworkFormDialog";
import {
    DataTableServer,
    type DataTableColumn,
} from "@/components/shared/DataTableServer";

type DialogMode = "create" | "edit" | null;

const NetworksPage = () => {
    const [page, setPage] = useState<number>(1);
    const [perPage] = useState<number>(15);
    const [search, setSearch] = useState<string>("");
    const [activeOnly, setActiveOnly] = useState<boolean>(false);
    const [maintenanceOnly, setMaintenanceOnly] = useState<boolean>(false);

    const [dialogMode, setDialogMode] = useState<DialogMode>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Network | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const [toggleTarget, setToggleTarget] = useState<Network | null>(null);

    const { networks, meta, isLoading, error, refetch } = useNetworks({
        page,
        perPage,
        search,
        isActive: activeOnly ? true : undefined,
        isMaintenance: maintenanceOnly ? true : undefined,
    });

    const { deleteNetwork } = useDeleteNetwork();

    const openCreate = () => {
        setSelectedNetwork(null);
        setDialogMode("create");
    };

    const openEdit = (network: Network) => {
        setSelectedNetwork(network);
        setDialogMode("edit");
    };

    const closeDialog = () => {
        setDialogMode(null);
        setSelectedNetwork(null);
    };

    const confirmDelete = (network: Network) => {
        setDeleteTarget(network);
    };

    const openToggleMaintenance = (network: Network) => {
        setToggleTarget(network);
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteNetwork(deleteTarget.id);
            toast.success("Network deleted.");
            setDeleteTarget(null);
            await refetch();
        } catch {
            toast.error("Failed to delete network.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
    };


    const networkColumns: DataTableColumn<Network>[] = [
        {
            id: "name",
            header: NETWORK_STRINGS.LABEL_NAME,
            cell: (row) => row.name,
        },
        {
            id: "network_address",
            header: NETWORK_STRINGS.LABEL_NETWORK_ADDRESS,
            cell: (row) => (
                <Badge variant="outline" className="font-mono text-xs">
                    {row.network_address}
                </Badge>
            ),
        },
        {
            id: "wirepas_version",
            header: NETWORK_STRINGS.LABEL_WIREPAS_VERSION,
            cell: (row) => row.wirepas_version ?? UI_STRINGS.N_A,
        },
        {
            id: "diagnostic_interval",
            header: NETWORK_STRINGS.LABEL_DIAGNOSTIC_INTERVAL,
            cell: (row) => `${row.diagnostic_interval} min`,
        },
        {
            id: "alarm_threshold",
            header: NETWORK_STRINGS.LABEL_ALARM_THRESHOLD,
            cell: (row) => `${row.alarm_threshold} ${row.alarm_threshold_unit}`,
        },
        {
            id: "is_active",
            header: NETWORK_STRINGS.LABEL_IS_ACTIVE,
            cell: (row) => (
                <Badge
                    className={cn(
                        "text-xs",
                        row.is_active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
                            : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
                    )}
                >
                    {row.is_active ? UI_STRINGS.YES : UI_STRINGS.NO}
                </Badge>
            ),
        },
        {
            id: "is_maintenance",
            header: NETWORK_STRINGS.LABEL_IS_MAINTENANCE,
            cell: (row) =>
                row.is_maintenance ? (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs">
                        Maintenance
                    </Badge>
                ) : null,
        },
        {
            id: "node_types",
            header: NETWORK_STRINGS.LABEL_NODE_TYPES,
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.node_types.slice(0, 3).map((type) => (
                        <Badge
                            key={type.id}
                            variant="secondary"
                            className="text-xs"
                        >
                            {type.name}
                        </Badge>
                    ))}
                    {row.node_types.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                            +{row.node_types.length - 3} more
                        </span>
                    )}
                </div>
            ),
        },
        {
            id: "actions",
            header: UI_STRINGS.ACTIONS,
            className: "text-right",
            cell: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEdit(row)}
                        aria-label="Edit network"
                    >
                        <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openToggleMaintenance(row)}
                        aria-label={NETWORK_STRINGS.TOGGLE_ACTION_LABEL}
                    >
                        <Wrench className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => confirmDelete(row)}
                        aria-label="Delete network"
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {NETWORK_STRINGS.TITLE}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {NETWORK_STRINGS.SUBTITLE}
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {UI_STRINGS.SAVE}
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder={UI_STRINGS.SEARCH}
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {NETWORK_STRINGS.LABEL_IS_ACTIVE}
                    </span>
                    <Switch
                        checked={activeOnly}
                        onCheckedChange={(checked) => {
                            setActiveOnly(checked);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {NETWORK_STRINGS.LABEL_IS_MAINTENANCE}
                    </span>
                    <Switch
                        checked={maintenanceOnly}
                        onCheckedChange={(checked) => {
                            setMaintenanceOnly(checked);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <DataTableServer<Network>
                    columns={networkColumns}
                    data={error || isLoading ? [] : networks}
                    isLoading={isLoading}
                    emptyMessage={error ? UI_STRINGS.ERROR_GENERIC : UI_STRINGS.N_A}
                    meta={meta}
                    page={page}
                    onPageChange={handlePageChange}
                />
            </div>

            <NetworkFormDialog
                open={dialogMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDialog();
                    }
                }}
                network={selectedNetwork ?? undefined}
                onSuccess={() => {
                    void refetch();
                }}
            />

            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{UI_STRINGS.DELETE}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this network? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{UI_STRINGS.CANCEL}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {UI_STRINGS.DELETE}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {toggleTarget && (
                <ToggleMaintenanceDialog
                    open={toggleTarget !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setToggleTarget(null);
                        }
                    }}
                    network={toggleTarget}
                    onSuccess={() => {
                        void refetch();
                    }}
                />
            )}
        </div>
    );
};

interface NetworkFormDialogPlaceholderProps {
    open: boolean;
    mode: DialogMode;
    network: Network | null;
    onClose: () => void;
}

export default NetworksPage;

