// src/pages/gateways/GatewayListPage.tsx
// Gateway Settings list page with server-side pagination and CRUD actions.
// Access is role-based (gateway.* permissions) — not superadmin-only.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit3, Trash2, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DataTableServer,
  type DataTableColumn,
} from '@/components/shared/DataTableServer';
import { useGatewayList, useDeleteGateway } from '@/hooks/useGateways';
import { useGatewayPermissions } from '@/hooks/useGatewayPermissions';
import { useNetworkOptions } from '@/hooks/useNetworks';
import type { Gateway, GatewayStatus } from '@/types/gateway';
import {
  GATEWAY_STRINGS,
  GATEWAY_STATUS_LABELS,
  UI_STRINGS,
} from '@/constants/strings';
import { cn } from '@/lib/utils';
import GatewayFormDialog from './GatewayFormDialog';
import DeleteGatewayDialog from './DeleteGatewayDialog';
import SendGatewayCommandDialog from './SendGatewayCommandDialog';

// ─── Status badge colours ──────────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<GatewayStatus, string> = {
  online: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  offline: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  unknown: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
} as const;

// ─── Component ────────────────────────────────────────────────────

const GatewayListPage = () => {
  const navigate = useNavigate();

  // ── Table state ──────────────────────────────────────────────────
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(15);
  const [filterNetworkId, setFilterNetworkId] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<GatewayStatus | undefined>();
  const [filterTestMode, setFilterTestMode] = useState<boolean>(false);

  // ── Dialog state ─────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<Gateway | undefined>();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Gateway | null>(null);

  const [commandDialogOpen, setCommandDialogOpen] = useState<boolean>(false);
  const [commandTarget, setCommandTarget] = useState<Gateway | null>(null);

  // ── Data ─────────────────────────────────────────────────────────
  const { gateways, meta, isLoading, error, refetch } = useGatewayList({
    page,
    perPage,
    network_id: filterNetworkId,
    status: filterStatus,
    is_test_mode: filterTestMode ? true : undefined,
  });

  const { options: networkOptions, isLoading: networksLoading, refetch: refetchNetworkOptions } = useNetworkOptions();
  const { remove, isDeleting } = useDeleteGateway();
  const { canCreate, canUpdate, canDelete, canSendCommand } = useGatewayPermissions();

  // ── Handlers ─────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(undefined);
    setFormOpen(true);
  };

  const openEdit = (gw: Gateway) => {
    setEditTarget(gw);
    setFormOpen(true);
  };

  const openDelete = (gw: Gateway) => {
    setDeleteTarget(gw);
    setDeleteDialogOpen(true);
  };

  const openSendCommand = (gw: Gateway) => {
    setCommandTarget(gw);
    setCommandDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      toast.success(GATEWAY_STRINGS.SUCCESS_DELETE);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await refetch();
    } catch {
      toast.error(GATEWAY_STRINGS.ERROR_DELETE);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────

  const columns: DataTableColumn<Gateway>[] = [
    {
      id: 'name',
      header: GATEWAY_STRINGS.COL_NAME,
      cell: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      id: 'gateway_id',
      header: GATEWAY_STRINGS.COL_GATEWAY_ID,
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.gateway_id}
        </Badge>
      ),
    },
    {
      id: 'network',
      header: GATEWAY_STRINGS.COL_NETWORK,
      cell: (row) => row.network.name,
    },
    {
      id: 'sink_id',
      header: GATEWAY_STRINGS.COL_SINK_ID,
      cell: (row) => (
        <span className="font-mono text-sm">{row.sink_id}</span>
      ),
    },
    {
      id: 'status',
      header: GATEWAY_STRINGS.COL_STATUS,
      cell: (row) => (
        <Badge className={cn('text-xs', STATUS_BADGE_CLASSES[row.status])}>
          {GATEWAY_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      id: 'is_test_mode',
      header: GATEWAY_STRINGS.COL_TEST_MODE,
      cell: (row) =>
        row.is_test_mode ? (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs">
            {GATEWAY_STRINGS.TEST_MODE_ON}
          </Badge>
        ) : null,
    },
    {
      id: 'last_seen_at',
      header: GATEWAY_STRINGS.COL_LAST_SEEN,
      cell: (row) =>
        row.last_seen_at
          ? new Date(row.last_seen_at).toLocaleString()
          : GATEWAY_STRINGS.NEVER_SEEN,
    },
    {
      id: 'actions',
      header: GATEWAY_STRINGS.COL_ACTIONS,
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/gateways/${row.id}`)}
            aria-label={GATEWAY_STRINGS.ACTION_VIEW}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canUpdate() && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => openEdit(row)}
              aria-label={GATEWAY_STRINGS.ACTION_EDIT}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          {canSendCommand() && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => openSendCommand(row)}
              aria-label={GATEWAY_STRINGS.ACTION_SEND_COMMAND}
            >
              <Terminal className="h-4 w-4" />
            </Button>
          )}
          {canDelete() && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => openDelete(row)}
              aria-label={GATEWAY_STRINGS.ACTION_DELETE}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────

  const STATUS_FILTER_OPTIONS: { value: GatewayStatus; label: string }[] = [
    { value: 'online', label: GATEWAY_STATUS_LABELS.online },
    { value: 'offline', label: GATEWAY_STATUS_LABELS.offline },
    { value: 'unknown', label: GATEWAY_STATUS_LABELS.unknown },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {GATEWAY_STRINGS.TITLE}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{GATEWAY_STRINGS.SUBTITLE}</p>
        </div>
        {canCreate() && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {GATEWAY_STRINGS.ADD_GATEWAY}
          </Button>
        )}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Network filter */}
        <Select
          value={filterNetworkId !== undefined ? String(filterNetworkId) : 'all'}
          onValueChange={(val) => {
            setFilterNetworkId(val === 'all' ? undefined : Number(val));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={GATEWAY_STRINGS.FILTER_NETWORK_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{GATEWAY_STRINGS.FILTER_NETWORK_PLACEHOLDER}</SelectItem>
            {networkOptions.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={filterStatus ?? 'all'}
          onValueChange={(val) => {
            setFilterStatus(val === 'all' ? undefined : (val as GatewayStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={GATEWAY_STRINGS.FILTER_STATUS_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{GATEWAY_STRINGS.FILTER_STATUS_PLACEHOLDER}</SelectItem>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Test mode toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="gw-test-filter"
            checked={filterTestMode}
            onCheckedChange={(checked) => {
              setFilterTestMode(checked);
              setPage(1);
            }}
          />
          <Label htmlFor="gw-test-filter" className="text-sm text-muted-foreground">
            {GATEWAY_STRINGS.FILTER_TEST_MODE_LABEL}
          </Label>
        </div>
      </div>

      {/* ── Load error ───────────────────────────────────────────── */}
      {error && (
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            {UI_STRINGS.RETRY}
          </Button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <DataTableServer<Gateway>
          columns={columns}
          data={error || isLoading ? [] : gateways}
          isLoading={isLoading}
          emptyMessage={error ? GATEWAY_STRINGS.ERROR_LOAD : GATEWAY_STRINGS.NO_GATEWAYS}
          meta={meta}
          page={page}
          onPageChange={setPage}
        />
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────── */}
      <GatewayFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditTarget(undefined);
          }
        }}
        gateway={editTarget}
        onSuccess={() => { void refetch(); void refetchNetworkOptions(); }}
        networkOptions={networkOptions}
        networksLoading={networksLoading}
      />

      <DeleteGatewayDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
          }
        }}
        gateway={deleteTarget}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />

      <SendGatewayCommandDialog
        open={commandDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCommandDialogOpen(false);
            setCommandTarget(null);
          }
        }}
        gateway={commandTarget}
      />
    </div>
  );
};

export default GatewayListPage;
