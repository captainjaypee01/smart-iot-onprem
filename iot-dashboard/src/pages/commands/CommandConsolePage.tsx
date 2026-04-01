// src/pages/commands/CommandConsolePage.tsx
// Command Console page: Send Command form (top) + Command History table (bottom).
// Guarded by command.view permission; Send section shown only if command.create is held.

import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, RefreshCw, RotateCcw, Terminal } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataTableServer, type DataTableColumn } from '@/components/shared/DataTableServer';

import CommandDetailDialog from './CommandDetailDialog';

import { useCommandPermissions } from '@/hooks/useCommandPermissions';
import { useCommands, useSendCommand } from '@/hooks/useCommands';
import { useNetworkOptions } from '@/hooks/useNetworks';
import { useAuthStore } from '@/store/authStore';
import { useRole } from '@/hooks/useRole';

import {
    COMMAND_STRINGS,
    PROCESSING_STATUS_OPTIONS,
    MESSAGE_STATUS_OPTIONS,
} from '@/constants/commands';
import { UI_STRINGS } from '@/constants/strings';
import { cn } from '@/lib/utils';

import type { CommandFilters, CommandRecord, ProcessingStatusValue, MessageStatusValue } from '@/types/command';

// ─── Sentinel values for "all" selects ────────────────────────────
const ALL_VALUE = 'all';

// ─── Processing status badge colours ──────────────────────────────
const PROCESSING_STATUS_CLASSES: Record<number, string> = {
    1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    3: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
    4: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

// ─── Blank form state ─────────────────────────────────────────────
interface SendFormState {
    network_id: string;         // string for Select; converted to number on submit
    node_address: string;
    source_ep: string;
    dest_ep: string;
    payload: string;
    tracking_mode: 'auto' | 'manual' | 'none';
    packet_id: string;
}

const BLANK_FORM: SendFormState = {
    network_id: '',
    node_address: '',
    source_ep: '',
    dest_ep: '',
    payload: '',
    tracking_mode: 'none',
    packet_id: '',
};

// ─── Simple field validation ───────────────────────────────────────
interface FormErrors {
    network_id?: string;
    node_address?: string;
    source_ep?: string;
    dest_ep?: string;
    payload?: string;
    packet_id?: string;
}

const HEX_RE = /^[0-9A-Fa-f]*$/;
const HEX_ADDR_RE = /^[0-9A-Fa-f]+$/;
const PACKET_ID_RE = /^[0-9A-Fa-f]{4}$/;

function validateForm(form: SendFormState): FormErrors {
    const errors: FormErrors = {};

    if (!form.network_id) {
        errors.network_id = COMMAND_STRINGS.ERROR_NETWORK_REQUIRED;
    }

    if (!form.node_address.trim()) {
        errors.node_address = COMMAND_STRINGS.ERROR_NODE_ADDRESS_REQUIRED;
    } else if (form.node_address.length > 10) {
        errors.node_address = COMMAND_STRINGS.ERROR_NODE_ADDRESS_MAX;
    } else if (!HEX_ADDR_RE.test(form.node_address)) {
        errors.node_address = COMMAND_STRINGS.ERROR_NODE_ADDRESS_HEX;
    }

    if (form.source_ep !== '') {
        const n = Number(form.source_ep);
        if (!Number.isInteger(n) || n < 1 || n > 255) {
            errors.source_ep = COMMAND_STRINGS.ERROR_SOURCE_EP_RANGE;
        }
    }

    if (form.dest_ep !== '') {
        const n = Number(form.dest_ep);
        if (!Number.isInteger(n) || n < 1 || n > 255) {
            errors.dest_ep = COMMAND_STRINGS.ERROR_DEST_EP_RANGE;
        }
    }

    if (form.payload !== '' && !HEX_RE.test(form.payload)) {
        errors.payload = COMMAND_STRINGS.ERROR_PAYLOAD_HEX;
    }

    if (form.tracking_mode === 'manual') {
        if (!form.packet_id) {
            errors.packet_id = COMMAND_STRINGS.ERROR_PACKET_ID_REQUIRED;
        } else if (!PACKET_ID_RE.test(form.packet_id)) {
            errors.packet_id = COMMAND_STRINGS.ERROR_PACKET_ID_FORMAT;
        }
    }

    return errors;
}

// ─── CommandConsolePage ───────────────────────────────────────────

const CommandConsolePage = () => {
    const { canViewCommands, canCreateCommand } = useCommandPermissions();
    const { isSuperAdmin } = useRole();
    const currentUser = useAuthStore((s) => s.user);

    // Guard: redirect if user cannot view commands at all.
    if (!canViewCommands()) {
        return <Navigate to="/403" replace />;
    }

    const canCreate = canCreateCommand();

    // ── Detail dialog state ───────────────────────────────────────
    const [detailId, setDetailId] = useState<string | null>(null);

    // ── Network options for both form and filter ──────────────────
    const { options: networkOptions, isLoading: networkOptionsLoading } =
        useNetworkOptions();

    // ── Command history ───────────────────────────────────────────
    const {
        commands,
        meta,
        isLoading,
        error,
        page,
        setPage,
        perPage,
        setPerPage,
        setFilters,
        autoRefresh,
        setAutoRefresh,
        refetch,
    } = useCommands();

    // ── Send Command form state ───────────────────────────────────
    const [form, setForm] = useState<SendFormState>(BLANK_FORM);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const { send, isSubmitting } = useSendCommand();

    // ── Filter bar local state ────────────────────────────────────
    const [filterNetworkId, setFilterNetworkId] = useState<string>(ALL_VALUE);
    const [filterProcessingStatus, setFilterProcessingStatus] =
        useState<string>(ALL_VALUE);
    const [filterMessageStatus, setFilterMessageStatus] =
        useState<string>(ALL_VALUE);
    const [filterNodeAddress, setFilterNodeAddress] = useState<string>('');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');

    // Apply filters to the hook whenever filter state changes.
    useEffect(() => {
        const newFilters: CommandFilters = {};
        if (filterNetworkId !== ALL_VALUE)
            newFilters.network_id = Number(filterNetworkId);
        if (filterProcessingStatus !== ALL_VALUE)
            newFilters.processing_status = Number(
                filterProcessingStatus,
            ) as ProcessingStatusValue;
        if (filterMessageStatus !== ALL_VALUE)
            newFilters.message_status = Number(
                filterMessageStatus,
            ) as MessageStatusValue;
        if (filterNodeAddress.trim())
            newFilters.node_address = filterNodeAddress.trim().toUpperCase();
        if (filterDateFrom) newFilters.date_from = filterDateFrom;
        if (filterDateTo) newFilters.date_to = filterDateTo;

        setFilters(newFilters);
    }, [
        filterNetworkId,
        filterProcessingStatus,
        filterMessageStatus,
        filterNodeAddress,
        filterDateFrom,
        filterDateTo,
        setFilters,
    ]);

    const handleResetFilters = useCallback(() => {
        setFilterNetworkId(ALL_VALUE);
        setFilterProcessingStatus(ALL_VALUE);
        setFilterMessageStatus(ALL_VALUE);
        setFilterNodeAddress('');
        setFilterDateFrom('');
        setFilterDateTo('');
    }, []);

    // ── Form field helpers ────────────────────────────────────────
    const updateField = <K extends keyof SendFormState>(
        key: K,
        value: SendFormState[K],
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        // Clear the error for this field on change.
        if (formErrors[key as keyof FormErrors]) {
            setFormErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    const handleNodeAddressBlur = () => {
        setForm((prev) => ({
            ...prev,
            node_address: prev.node_address.toUpperCase(),
        }));
    };

    const handlePacketIdBlur = () => {
        setForm((prev) => ({
            ...prev,
            packet_id: prev.packet_id.toUpperCase(),
        }));
    };

    // ── Send Command submit ───────────────────────────────────────
    const handleSend = async () => {
        const errors = validateForm(form);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            await send({
                network_id: Number(form.network_id),
                node_address: form.node_address.toUpperCase(),
                source_ep: form.source_ep !== '' ? Number(form.source_ep) : null,
                dest_ep: form.dest_ep !== '' ? Number(form.dest_ep) : null,
                payload: form.payload || null,
                include_tracking_id: form.tracking_mode,
                packet_id: form.tracking_mode === 'manual'
                    ? form.packet_id.toUpperCase()
                    : null,
            });
            toast.success(COMMAND_STRINGS.SUCCESS_SEND);
            setForm(BLANK_FORM);
            setFormErrors({});
            void refetch();
        } catch {
            toast.error(COMMAND_STRINGS.ERROR_SEND);
        }
    };

    // ── Table columns ─────────────────────────────────────────────
    const columns: DataTableColumn<CommandRecord>[] = [
        {
            id: 'sent_at',
            header: COMMAND_STRINGS.COL_SENT_AT,
            cell: (row) =>
                row.requested_at
                    ? new Date(row.requested_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      })
                    : new Date(row.created_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      }),
        },
        {
            id: 'network',
            header: COMMAND_STRINGS.COL_NETWORK,
            cell: (row) => row.network.name,
        },
        {
            id: 'node_address',
            header: COMMAND_STRINGS.COL_NODE_ADDRESS,
            cell: (row) => row.node_address ?? UI_STRINGS.N_A,
        },
        {
            id: 'endpoints',
            header: COMMAND_STRINGS.COL_ENDPOINTS,
            cell: (row) => {
                const src = row.source_ep ?? '—';
                const dst = row.dest_ep ?? '—';
                return `${String(src)} → ${String(dst)}`;
            },
        },
        {
            id: 'type',
            header: COMMAND_STRINGS.COL_TYPE,
            cell: (row) => row.type,
        },
        {
            id: 'processing_status',
            header: COMMAND_STRINGS.COL_PROCESSING_STATUS,
            cell: (row) =>
                row.processing_status != null ? (
                    <Badge
                        className={cn(
                            'text-xs',
                            PROCESSING_STATUS_CLASSES[row.processing_status] ??
                                'bg-gray-100 text-gray-700',
                        )}
                    >
                        {row.processing_status_label ?? String(row.processing_status)}
                    </Badge>
                ) : (
                    UI_STRINGS.N_A
                ),
        },
        {
            id: 'message_status',
            header: COMMAND_STRINGS.COL_MESSAGE_STATUS,
            cell: (row) =>
                row.message_status_label ?? UI_STRINGS.N_A,
        },
        {
            id: 'packet_id',
            header: COMMAND_STRINGS.COL_PACKET_ID,
            cell: (row) => row.packet_id ?? '—',
        },
        {
            id: 'retry',
            header: COMMAND_STRINGS.COL_RETRY,
            cell: (row) =>
                COMMAND_STRINGS.RETRY_COUNT_LABEL(row.retry_count),
        },
        {
            id: 'created_by',
            header: COMMAND_STRINGS.COL_CREATED_BY,
            cell: (row) => row.created_by?.name ?? UI_STRINGS.N_A,
        },
        {
            id: 'actions',
            header: COMMAND_STRINGS.COL_ACTIONS,
            className: 'text-right',
            cell: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setDetailId(String(row.id)); }}
                >
                    {COMMAND_STRINGS.ACTION_VIEW}
                </Button>
            ),
        },
    ];

    // ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-8">
            {/* ── Page header ──────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <Terminal className="h-6 w-6 text-muted-foreground" />
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {COMMAND_STRINGS.PAGE_TITLE}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {COMMAND_STRINGS.PAGE_SUBTITLE}
                    </p>
                </div>
            </div>

            {/* ── Send Command form (only when canCreate) ───────── */}
            {canCreate && (
                <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold text-foreground">
                        {COMMAND_STRINGS.FORM_SECTION_TITLE}
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Network */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cmd-network">
                                {COMMAND_STRINGS.LABEL_NETWORK}
                            </Label>
                            <Select
                                value={form.network_id}
                                onValueChange={(v) => updateField('network_id', v)}
                                disabled={networkOptionsLoading}
                            >
                                <SelectTrigger id="cmd-network">
                                    <SelectValue
                                        placeholder={COMMAND_STRINGS.PLACEHOLDER_NETWORK}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {networkOptions.map((opt) => (
                                        <SelectItem
                                            key={opt.id}
                                            value={String(opt.id)}
                                        >
                                            {opt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.network_id && (
                                <p className="text-xs text-destructive">
                                    {formErrors.network_id}
                                </p>
                            )}
                        </div>

                        {/* Node Address */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cmd-node-address">
                                {COMMAND_STRINGS.LABEL_NODE_ADDRESS}
                            </Label>
                            <Input
                                id="cmd-node-address"
                                value={form.node_address}
                                placeholder={COMMAND_STRINGS.PLACEHOLDER_NODE_ADDRESS}
                                maxLength={10}
                                onChange={(e) =>
                                    updateField('node_address', e.target.value)
                                }
                                onBlur={handleNodeAddressBlur}
                            />
                            {formErrors.node_address && (
                                <p className="text-xs text-destructive">
                                    {formErrors.node_address}
                                </p>
                            )}
                        </div>

                        {/* Source Endpoint */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cmd-source-ep">
                                {COMMAND_STRINGS.LABEL_SOURCE_EP}
                            </Label>
                            <Input
                                id="cmd-source-ep"
                                type="number"
                                min={1}
                                max={255}
                                value={form.source_ep}
                                placeholder={COMMAND_STRINGS.PLACEHOLDER_SOURCE_EP}
                                onChange={(e) =>
                                    updateField('source_ep', e.target.value)
                                }
                            />
                            {formErrors.source_ep && (
                                <p className="text-xs text-destructive">
                                    {formErrors.source_ep}
                                </p>
                            )}
                        </div>

                        {/* Destination Endpoint */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cmd-dest-ep">
                                {COMMAND_STRINGS.LABEL_DEST_EP}
                            </Label>
                            <Input
                                id="cmd-dest-ep"
                                type="number"
                                min={1}
                                max={255}
                                value={form.dest_ep}
                                placeholder={COMMAND_STRINGS.PLACEHOLDER_DEST_EP}
                                onChange={(e) =>
                                    updateField('dest_ep', e.target.value)
                                }
                            />
                            {formErrors.dest_ep && (
                                <p className="text-xs text-destructive">
                                    {formErrors.dest_ep}
                                </p>
                            )}
                        </div>

                        {/* Payload */}
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <Label htmlFor="cmd-payload">
                                {COMMAND_STRINGS.LABEL_PAYLOAD}
                            </Label>
                            <Input
                                id="cmd-payload"
                                value={form.payload}
                                placeholder={COMMAND_STRINGS.PLACEHOLDER_PAYLOAD}
                                onChange={(e) =>
                                    updateField('payload', e.target.value)
                                }
                            />
                            {formErrors.payload && (
                                <p className="text-xs text-destructive">
                                    {formErrors.payload}
                                </p>
                            )}
                        </div>

                        {/* Tracking ID mode */}
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <Label htmlFor="cmd-tracking-mode">
                                {COMMAND_STRINGS.LABEL_TRACKING_MODE}
                            </Label>
                            <Select
                                value={form.tracking_mode}
                                onValueChange={(v) => {
                                    updateField('tracking_mode', v as 'auto' | 'manual' | 'none');
                                    if (v !== 'manual') {
                                        updateField('packet_id', '');
                                    }
                                }}
                            >
                                <SelectTrigger id="cmd-tracking-mode">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">{COMMAND_STRINGS.TRACKING_MODE_AUTO}</SelectItem>
                                    <SelectItem value="manual">{COMMAND_STRINGS.TRACKING_MODE_MANUAL}</SelectItem>
                                    <SelectItem value="none">{COMMAND_STRINGS.TRACKING_MODE_NONE}</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {COMMAND_STRINGS.HELPER_TRACKING_MODE}
                            </p>
                        </div>

                        {/* Packet ID — visible only when tracking mode is Manual */}
                        {form.tracking_mode === 'manual' && (
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="cmd-packet-id">
                                    {COMMAND_STRINGS.LABEL_PACKET_ID}
                                </Label>
                                <Input
                                    id="cmd-packet-id"
                                    value={form.packet_id}
                                    placeholder={COMMAND_STRINGS.PLACEHOLDER_PACKET_ID}
                                    maxLength={4}
                                    onChange={(e) =>
                                        updateField('packet_id', e.target.value)
                                    }
                                    onBlur={handlePacketIdBlur}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {COMMAND_STRINGS.HELPER_PACKET_ID}
                                </p>
                                {formErrors.packet_id && (
                                    <p className="text-xs text-destructive">
                                        {formErrors.packet_id}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            onClick={() => void handleSend()}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {COMMAND_STRINGS.SUBMITTING_BUTTON}
                                </>
                            ) : (
                                COMMAND_STRINGS.SUBMIT_BUTTON
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Command History ───────────────────────────────── */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-foreground">
                        {COMMAND_STRINGS.HISTORY_SECTION_TITLE}
                    </h2>

                    {/* Auto-refresh toggle + manual refresh */}
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center gap-2"
                            title={
                                autoRefresh
                                    ? COMMAND_STRINGS.AUTO_REFRESH_ACTIVE_TITLE
                                    : COMMAND_STRINGS.AUTO_REFRESH_INACTIVE_TITLE
                            }
                        >
                            {autoRefresh && (
                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            )}
                            <Label
                                htmlFor="auto-refresh-toggle"
                                className="cursor-pointer text-sm"
                            >
                                {COMMAND_STRINGS.AUTO_REFRESH_LABEL}
                            </Label>
                            <Switch
                                id="auto-refresh-toggle"
                                checked={autoRefresh}
                                onCheckedChange={setAutoRefresh}
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => void refetch()}
                            aria-label={UI_STRINGS.REFRESH}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* ── Filters bar ───────────────────────────────── */}
                <div className="flex flex-wrap items-end gap-3">
                    {/* Network filter */}
                    <div className="flex flex-col gap-1">
                        <Select
                            value={filterNetworkId}
                            onValueChange={(v) => {
                                setFilterNetworkId(v);
                            }}
                        >
                            <SelectTrigger className="min-w-[160px]">
                                <SelectValue
                                    placeholder={
                                        COMMAND_STRINGS.FILTER_NETWORK_PLACEHOLDER
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_VALUE}>
                                    {COMMAND_STRINGS.FILTER_NETWORK_PLACEHOLDER}
                                </SelectItem>
                                {networkOptions.map((opt) => (
                                    <SelectItem
                                        key={opt.id}
                                        value={String(opt.id)}
                                    >
                                        {opt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Processing status filter */}
                    <div className="flex flex-col gap-1">
                        <Select
                            value={filterProcessingStatus}
                            onValueChange={setFilterProcessingStatus}
                        >
                            <SelectTrigger className="min-w-[200px]">
                                <SelectValue
                                    placeholder={
                                        COMMAND_STRINGS.FILTER_PROCESSING_STATUS_PLACEHOLDER
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_VALUE}>
                                    {
                                        COMMAND_STRINGS.FILTER_PROCESSING_STATUS_PLACEHOLDER
                                    }
                                </SelectItem>
                                {PROCESSING_STATUS_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={String(opt.value)}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Message status filter */}
                    <div className="flex flex-col gap-1">
                        <Select
                            value={filterMessageStatus}
                            onValueChange={setFilterMessageStatus}
                        >
                            <SelectTrigger className="min-w-[240px]">
                                <SelectValue
                                    placeholder={
                                        COMMAND_STRINGS.FILTER_MESSAGE_STATUS_PLACEHOLDER
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_VALUE}>
                                    {
                                        COMMAND_STRINGS.FILTER_MESSAGE_STATUS_PLACEHOLDER
                                    }
                                </SelectItem>
                                {MESSAGE_STATUS_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={String(opt.value)}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Node address filter */}
                    <Input
                        className="min-w-[160px] max-w-[200px]"
                        placeholder={COMMAND_STRINGS.FILTER_NODE_ADDRESS_PLACEHOLDER}
                        value={filterNodeAddress}
                        onChange={(e) => setFilterNodeAddress(e.target.value)}
                    />

                    {/* Date from */}
                    <Input
                        type="date"
                        className="w-[160px]"
                        value={filterDateFrom}
                        placeholder={COMMAND_STRINGS.FILTER_DATE_FROM_PLACEHOLDER}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                    />

                    {/* Date to */}
                    <Input
                        type="date"
                        className="w-[160px]"
                        value={filterDateTo}
                        placeholder={COMMAND_STRINGS.FILTER_DATE_TO_PLACEHOLDER}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                    />

                    {/* Reset */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="gap-1"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {COMMAND_STRINGS.RESET_FILTERS}
                    </Button>
                </div>

                {/* ── Table ─────────────────────────────────────── */}
                <div className="overflow-x-auto">
                    <DataTableServer<CommandRecord>
                        columns={columns}
                        data={error !== null || isLoading ? [] : commands}
                        isLoading={isLoading}
                        emptyMessage={
                            error !== null
                                ? COMMAND_STRINGS.ERROR_LOAD
                                : COMMAND_STRINGS.NO_COMMANDS
                        }
                        meta={meta}
                        page={page}
                        onPageChange={setPage}
                        perPage={perPage}
                        onPerPageChange={setPerPage}
                    />
                </div>
            </div>

            <CommandDetailDialog
                id={detailId}
                onClose={() => { setDetailId(null); }}
                onResendSuccess={() => {
                    setDetailId(null);
                    void refetch();
                }}
                currentUserId={currentUser?.id ?? null}
                canCreate={canCreate}
                isSuperAdmin={isSuperAdmin()}
            />
        </div>
    );
};

export default CommandConsolePage;
