// src/pages/node-decommission/NodeDecommissionPage.tsx
// Main Node Decommission page. Provides a network selector, a decommissionable node list,
// and a decommission history log — all scoped to the selected network.

import { useState, useCallback, useRef } from 'react';
import { Loader2, RefreshCw, ServerCrash } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DataTableServer,
  type DataTableColumn,
} from '@/components/shared/DataTableServer';
import { useDecommissionNodes, useDecommissionHistory, useResendDecommission, useVerifyDecommission } from '@/hooks/useNodeDecommission';
import { useNodeDecommissionPermissions } from '@/hooks/useNodeDecommissionPermissions';
import { useNetworkOptions } from '@/hooks/useNetworks';
import { useNodeTypeOptions } from '@/hooks/useNodeTypes';
import type { DecommissionNode, NodeDecommissionLog, NodeDecommissionLogStatus } from '@/types/nodeDecommission';
import { NODE_DECOMMISSION_STRINGS, UI_STRINGS } from '@/constants/strings';
import { cn } from '@/lib/utils';
import NodeDecommissionDialog from './NodeDecommissionDialog';
import ManualDecommissionDialog from './ManualDecommissionDialog';
import NodeDecommissionLogDetailDialog from './NodeDecommissionLogDetailDialog';

// ─── Badge helpers ────────────────────────────────────────────────

const NODE_STATUS_CLASSES: Record<'new' | 'active', string> = {
  new: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
};

const LOG_STATUS_CLASSES: Record<NodeDecommissionLogStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  failed:    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  manual:    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
};

const LOG_STATUS_LABELS: Record<NodeDecommissionLogStatus, string> = {
  pending:   NODE_DECOMMISSION_STRINGS.LOG_STATUS_PENDING,
  completed: NODE_DECOMMISSION_STRINGS.LOG_STATUS_COMPLETED,
  failed:    NODE_DECOMMISSION_STRINGS.LOG_STATUS_FAILED,
  manual:    NODE_DECOMMISSION_STRINGS.LOG_STATUS_MANUAL,
};

// ─── History status filter options ───────────────────────────────

const HISTORY_STATUS_OPTIONS: { value: NodeDecommissionLogStatus | 'all'; label: string }[] = [
  { value: 'all',       label: NODE_DECOMMISSION_STRINGS.FILTER_STATUS_PLACEHOLDER },
  { value: 'pending',   label: NODE_DECOMMISSION_STRINGS.LOG_STATUS_PENDING },
  { value: 'completed', label: NODE_DECOMMISSION_STRINGS.LOG_STATUS_COMPLETED },
  { value: 'failed',    label: NODE_DECOMMISSION_STRINGS.LOG_STATUS_FAILED },
  { value: 'manual',    label: NODE_DECOMMISSION_STRINGS.LOG_STATUS_MANUAL },
];

// ─── Cooldown hook ────────────────────────────────────────────────

const REFRESH_COOLDOWN_MS = 5000;

function useCooldown() {
  const lastClickRef = useRef<number>(0);
  const [cooldownSecsLeft, setCooldownSecsLeft] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    lastClickRef.current = Date.now();
    setCooldownSecsLeft(Math.ceil(REFRESH_COOLDOWN_MS / 1000));
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastClickRef.current;
      const left = Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000);
      if (left <= 0) {
        setCooldownSecsLeft(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setCooldownSecsLeft(left);
      }
    }, 250);
  }, []);

  const isCoolingDown = cooldownSecsLeft > 0;

  return { isCoolingDown, cooldownSecsLeft, startCooldown };
}

// ─── Component ────────────────────────────────────────────────────

const NodeDecommissionPage = () => {
  // Network selector state
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);

  // Node list state
  const [nodePage, setNodePage] = useState<number>(1);
  const [nodeSearch, setNodeSearch] = useState<string>('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<number | undefined>();

  // History state
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyStatus, setHistoryStatus] = useState<NodeDecommissionLogStatus | 'all'>('all');

  // Dialog state
  const [decommissionDialogOpen, setDecommissionDialogOpen] = useState<boolean>(false);
  const [decommissionTarget, setDecommissionTarget] = useState<DecommissionNode | null>(null);

  const [manualDialogOpen, setManualDialogOpen] = useState<boolean>(false);
  const [manualTarget, setManualTarget] = useState<{ id: number; name: string } | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [detailLog, setDetailLog] = useState<NodeDecommissionLog | null>(null);

  // In-flight tracking per log id for verify/resend inline buttons
  const [verifyingLogId, setVerifyingLogId] = useState<number | null>(null);
  const [resendingLogId, setResendingLogId] = useState<number | null>(null);

  // Permissions
  const {
    canDecommissionNode,
    canVerifyDecommission,
    canManualDecommission,
  } = useNodeDecommissionPermissions();

  // Options (lifted to page level, passed down)
  const { options: networkOptions, isLoading: networksLoading } = useNetworkOptions();
  const { options: nodeTypeOptions } = useNodeTypeOptions();

  // Data hooks — only active when a network is selected
  const {
    nodes,
    meta: nodesMeta,
    isLoading: nodesLoading,
    error: nodesError,
    refetch: refetchNodes,
  } = useDecommissionNodes({
    network_id: selectedNetworkId ?? 0,
    page: nodePage,
    perPage: 15,
    search: nodeSearch,
    node_type_id: nodeTypeFilter,
    enabled: selectedNetworkId !== null,
  });

  const {
    logs,
    meta: historyMeta,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useDecommissionHistory({
    network_id: selectedNetworkId ?? 0,
    page: historyPage,
    perPage: 15,
    status: historyStatus === 'all' ? undefined : historyStatus,
    enabled: selectedNetworkId !== null,
  });

  // Mutations
  const { resend } = useResendDecommission();
  const { verify } = useVerifyDecommission();

  // Shared refresh cooldown (both tables share one cooldown)
  const { isCoolingDown, cooldownSecsLeft, startCooldown } = useCooldown();

  // ── Handlers ────────────────────────────────────────────────────

  const handleNetworkChange = (val: string) => {
    const id = Number(val);
    setSelectedNetworkId(id);
    setNodePage(1);
    setHistoryPage(1);
    setNodeSearch('');
    setNodeTypeFilter(undefined);
    setHistoryStatus('all');
  };

  const openDecommission = (node: DecommissionNode) => {
    setDecommissionTarget(node);
    setDecommissionDialogOpen(true);
  };

  const openDetail = (log: NodeDecommissionLog) => {
    setDetailLog(log);
    setDetailDialogOpen(true);
  };

  const openManual = (log: NodeDecommissionLog) => {
    setManualTarget({ id: log.node.id, name: log.node.name });
    setManualDialogOpen(true);
  };

  const handleVerify = async (logId: number, nodeId: number) => {
    setVerifyingLogId(logId);
    try {
      await verify(nodeId);
      toast.success(NODE_DECOMMISSION_STRINGS.SUCCESS_VERIFY);
      await Promise.all([refetchNodes(), refetchHistory()]);
    } catch {
      toast.error(NODE_DECOMMISSION_STRINGS.ERROR_VERIFY);
    } finally {
      setVerifyingLogId(null);
    }
  };

  const handleResend = async (logId: number, nodeId: number) => {
    setResendingLogId(logId);
    try {
      await resend(nodeId);
      toast.success(NODE_DECOMMISSION_STRINGS.SUCCESS_RESEND);
      await Promise.all([refetchNodes(), refetchHistory()]);
    } catch {
      toast.error(NODE_DECOMMISSION_STRINGS.ERROR_RESEND);
    } finally {
      setResendingLogId(null);
    }
  };

  const handleRefreshNodes = async () => {
    if (isCoolingDown) return;
    startCooldown();
    await Promise.all([refetchNodes(), refetchHistory()]);
  };

  const handleRefreshHistory = async () => {
    if (isCoolingDown) return;
    startCooldown();
    await refetchHistory();
  };

  // ── Node list columns ────────────────────────────────────────────

  const nodeColumns: DataTableColumn<DecommissionNode>[] = [
    {
      id: 'name',
      header: NODE_DECOMMISSION_STRINGS.COL_NODE_NAME,
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: 'node_address',
      header: NODE_DECOMMISSION_STRINGS.COL_NODE_ADDRESS,
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.node_address}
        </Badge>
      ),
    },
    {
      id: 'service_id',
      header: NODE_DECOMMISSION_STRINGS.COL_SERVICE_ID,
      cell: (row) => <span className="font-mono text-sm">{row.service_id}</span>,
    },
    {
      id: 'status',
      header: NODE_DECOMMISSION_STRINGS.COL_STATUS,
      cell: (row) => (
        <Badge className={cn('text-xs', NODE_STATUS_CLASSES[row.status])}>
          {row.status === 'new'
            ? NODE_DECOMMISSION_STRINGS.NODE_STATUS_NEW
            : NODE_DECOMMISSION_STRINGS.NODE_STATUS_ACTIVE}
        </Badge>
      ),
    },
    {
      id: 'latest_attempt',
      header: NODE_DECOMMISSION_STRINGS.COL_LAST_ATTEMPT,
      cell: (row) => {
        const log = row.latest_decommission_log;
        if (!log) return <span className="text-muted-foreground">{UI_STRINGS.N_A}</span>;
        return (
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', LOG_STATUS_CLASSES[log.status])}>
              {LOG_STATUS_LABELS[log.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(log.created_at).toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: NODE_DECOMMISSION_STRINGS.COL_ACTIONS,
      className: 'text-right',
      cell: (row) => {
        const log = row.latest_decommission_log;
        // Show "Decommission" only when no active attempt (no pending or failed log)
        const showDecommission =
          canDecommissionNode() &&
          (log === null || log.status === 'completed' || log.status === 'manual');

        if (!showDecommission) return null;

        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDecommission(row)}
          >
            {NODE_DECOMMISSION_STRINGS.ACTION_DECOMMISSION}
          </Button>
        );
      },
    },
  ];

  // ── History columns ──────────────────────────────────────────────

  const historyColumns: DataTableColumn<NodeDecommissionLog>[] = [
    {
      id: 'node',
      header: NODE_DECOMMISSION_STRINGS.COL_HISTORY_NODE,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.node.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.node.service_id}</p>
        </div>
      ),
    },
    {
      id: 'node_address',
      header: NODE_DECOMMISSION_STRINGS.COL_HISTORY_NODE_ADDRESS,
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.node.node_address}
        </Badge>
      ),
    },
    {
      id: 'initiated_by',
      header: NODE_DECOMMISSION_STRINGS.COL_HISTORY_INITIATED_BY,
      cell: (row) =>
        row.initiated_by?.name ?? NODE_DECOMMISSION_STRINGS.INITIATED_BY_UNKNOWN,
    },
    {
      id: 'status',
      header: NODE_DECOMMISSION_STRINGS.COL_HISTORY_STATUS,
      cell: (row) => (
        <Badge className={cn('text-xs', LOG_STATUS_CLASSES[row.status])}>
          {LOG_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      id: 'verification',
      header: NODE_DECOMMISSION_STRINGS.COL_HISTORY_VERIFICATION,
      cell: (row) => {
        if (row.verification_timed_out) {
          return (
            <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 text-xs">
              {NODE_DECOMMISSION_STRINGS.VERIFICATION_TIMED_OUT}
            </Badge>
          );
        }
        if (row.verification_sent_at) {
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(row.verification_sent_at).toLocaleString()}
            </span>
          );
        }
        return <span className="text-muted-foreground">{UI_STRINGS.N_A}</span>;
      },
    },
    {
      id: 'decommissioned_at',
      header: NODE_DECOMMISSION_STRINGS.COL_HISTORY_DECOMMISSIONED_AT,
      cell: (row) =>
        row.decommissioned_at
          ? new Date(row.decommissioned_at).toLocaleString()
          : <span className="text-muted-foreground">{UI_STRINGS.N_A}</span>,
    },
    {
      id: 'created_at',
      header: NODE_DECOMMISSION_STRINGS.COL_HISTORY_DATE,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'history_actions',
      header: NODE_DECOMMISSION_STRINGS.COL_ACTIONS,
      className: 'text-right',
      cell: (row) => {
        const isPending = row.status === 'pending';

        // "Verify" — pending for 2+ min, verify not sent yet
        const showVerify =
          canVerifyDecommission() &&
          isPending &&
          row.decommission_timed_out &&
          !row.verification_sent_at;

        // "Manual Decommission" — verify timed out AND node not yet decommissioned
        const showManual =
          canManualDecommission() &&
          isPending &&
          row.verification_timed_out &&
          row.node.status !== 'decommissioned';

        // "Resend Decommission" — verify was sent, node replied alive (failed), and still not decommissioned
        // node.status 'decommissioned' means manual was used instead — no resend needed
        const showResend =
          canVerifyDecommission() &&
          row.status === 'failed' &&
          row.node.status !== 'decommissioned';

        const isVerifyingThis = verifyingLogId === row.id;
        const isResendingThis = resendingLogId === row.id;

        return (
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDetail(row)}
            >
              {NODE_DECOMMISSION_STRINGS.ACTION_VIEW}
            </Button>
            {showVerify && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleVerify(row.id, row.node.id)}
                disabled={isVerifyingThis}
              >
                {isVerifyingThis && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {NODE_DECOMMISSION_STRINGS.ACTION_VERIFY}
              </Button>
            )}
            {showResend && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleResend(row.id, row.node.id)}
                disabled={isResendingThis}
              >
                {isResendingThis && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {NODE_DECOMMISSION_STRINGS.ACTION_RESEND}
              </Button>
            )}
            {showManual && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openManual(row)}
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                {NODE_DECOMMISSION_STRINGS.ACTION_MANUAL}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // ── Render ───────────────────────────────────────────────────────

  const isNetworkSelected = selectedNetworkId !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <ServerCrash className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {NODE_DECOMMISSION_STRINGS.TITLE}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {NODE_DECOMMISSION_STRINGS.SUBTITLE}
          </p>
        </div>
      </div>

      {/* ── Network Selector ──────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 max-w-sm">
        <Label htmlFor="network-select">
          {NODE_DECOMMISSION_STRINGS.SELECT_NETWORK_LABEL}
        </Label>
        <Select
          value={selectedNetworkId !== null ? String(selectedNetworkId) : ''}
          onValueChange={handleNetworkChange}
          disabled={networksLoading}
        >
          <SelectTrigger id="network-select">
            <SelectValue placeholder={NODE_DECOMMISSION_STRINGS.SELECT_NETWORK_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            {networkOptions.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Node List (only shown after network is selected) ───── */}
      {isNetworkSelected && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {NODE_DECOMMISSION_STRINGS.NODE_LIST_TITLE}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRefreshNodes()}
                disabled={isCoolingDown}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                {isCoolingDown
                  ? `${UI_STRINGS.REFRESH} (${cooldownSecsLeft}s)`
                  : UI_STRINGS.REFRESH}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="w-64"
                placeholder={NODE_DECOMMISSION_STRINGS.SEARCH_PLACEHOLDER}
                value={nodeSearch}
                onChange={(e) => {
                  setNodeSearch(e.target.value);
                  setNodePage(1);
                }}
              />
              <Select
                value={nodeTypeFilter !== undefined ? String(nodeTypeFilter) : 'all'}
                onValueChange={(val) => {
                  setNodeTypeFilter(val === 'all' ? undefined : Number(val));
                  setNodePage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={NODE_DECOMMISSION_STRINGS.FILTER_NODE_TYPE_PLACEHOLDER} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {NODE_DECOMMISSION_STRINGS.FILTER_NODE_TYPE_PLACEHOLDER}
                  </SelectItem>
                  {nodeTypeOptions.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Load error */}
            {nodesError && (
              <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-destructive">{nodesError}</p>
                <Button variant="outline" size="sm" onClick={() => void refetchNodes()}>
                  {UI_STRINGS.RETRY}
                </Button>
              </div>
            )}

            {/* Node table */}
            <div className="overflow-x-auto">
              <DataTableServer<DecommissionNode>
                columns={nodeColumns}
                data={nodesError || nodesLoading ? [] : nodes}
                isLoading={nodesLoading}
                emptyMessage={
                  nodesError
                    ? NODE_DECOMMISSION_STRINGS.ERROR_LOAD_NODES
                    : NODE_DECOMMISSION_STRINGS.NO_NODES
                }
                meta={nodesMeta}
                page={nodePage}
                onPageChange={setNodePage}
              />
            </div>
          </div>

          {/* ── Decommission History ──────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {NODE_DECOMMISSION_STRINGS.HISTORY_TITLE}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRefreshHistory()}
                disabled={isCoolingDown}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                {isCoolingDown
                  ? `${UI_STRINGS.REFRESH} (${cooldownSecsLeft}s)`
                  : UI_STRINGS.REFRESH}
              </Button>
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={historyStatus}
                onValueChange={(val) => {
                  setHistoryStatus(val as NodeDecommissionLogStatus | 'all');
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={NODE_DECOMMISSION_STRINGS.FILTER_STATUS_PLACEHOLDER} />
                </SelectTrigger>
                <SelectContent>
                  {HISTORY_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Load error */}
            {historyError && (
              <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-destructive">{historyError}</p>
                <Button variant="outline" size="sm" onClick={() => void refetchHistory()}>
                  {UI_STRINGS.RETRY}
                </Button>
              </div>
            )}

            {/* History table */}
            <div className="overflow-x-auto">
              <DataTableServer<NodeDecommissionLog>
                columns={historyColumns}
                data={historyError || historyLoading ? [] : logs}
                isLoading={historyLoading}
                emptyMessage={
                  historyError
                    ? NODE_DECOMMISSION_STRINGS.ERROR_LOAD_HISTORY
                    : NODE_DECOMMISSION_STRINGS.NO_HISTORY
                }
                meta={historyMeta}
                page={historyPage}
                onPageChange={setHistoryPage}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────── */}
      <NodeDecommissionDialog
        node={decommissionTarget}
        open={decommissionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDecommissionDialogOpen(false);
            setDecommissionTarget(null);
          }
        }}
        onSuccess={() => {
          void refetchNodes();
          void refetchHistory();
        }}
      />

      <ManualDecommissionDialog
        node={manualTarget}
        open={manualDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setManualDialogOpen(false);
            setManualTarget(null);
          }
        }}
        onSuccess={() => {
          void refetchNodes();
          void refetchHistory();
        }}
      />

      <NodeDecommissionLogDetailDialog
        log={detailLog}
        open={detailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDetailDialogOpen(false);
            setDetailLog(null);
          }
        }}
      />
    </div>
  );
};

export default NodeDecommissionPage;
