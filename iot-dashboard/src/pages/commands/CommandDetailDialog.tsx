// src/pages/commands/CommandDetailDialog.tsx
// Dialog showing all fields for a single command, with an optional Resend action.

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { useCommand, useResendCommand } from '@/hooks/useCommands';
import { COMMAND_STRINGS, PROCESSING_STATUS_OPTIONS } from '@/constants/commands';
import { cn } from '@/lib/utils';
import { PROCESSING_STATUS } from '@/types/command';

// ─── Processing status badge colours (mirror of CommandConsolePage) ──
const PROCESSING_STATUS_CLASSES: Record<number, string> = {
    1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    3: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
    4: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

// ─── Helper: format a nullable ISO datetime ────────────────────────
function fmtDatetime(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// ─── Detail row component ─────────────────────────────────────────
interface DetailRowProps {
    label: string;
    children: React.ReactNode;
}

const DetailRow = ({ label, children }: DetailRowProps) => (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-2">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm text-foreground">{children}</dd>
    </div>
);

// ─── Props ────────────────────────────────────────────────────────
interface CommandDetailDialogProps {
    id: string | null;
    onClose: () => void;
    onResendSuccess: () => void;
    currentUserId: number | null;
    canCreate: boolean;
    isSuperAdmin: boolean;
}

// ─── CommandDetailDialog ──────────────────────────────────────────
const CommandDetailDialog = ({
    id,
    onClose,
    onResendSuccess,
    currentUserId,
    canCreate,
    isSuperAdmin,
}: CommandDetailDialogProps) => {
    const { command, isLoading, error } = useCommand(id);
    const { resend, isSubmitting } = useResendCommand();

    const handleResend = async () => {
        if (!command) return;
        try {
            await resend(command.id);
            toast.success(COMMAND_STRINGS.SUCCESS_RESEND);
            onResendSuccess();
            onClose();
        } catch {
            toast.error(COMMAND_STRINGS.ERROR_RESEND);
        }
    };

    // Resend visibility: canCreate AND (isOwner OR isSuperAdmin) AND retry_count < 3
    // AND processing_status !== FAILED (4)
    const isOwner =
        currentUserId != null &&
        command?.created_by != null &&
        command.created_by.id === currentUserId;

    const canResend =
        command != null &&
        canCreate &&
        (isOwner || isSuperAdmin) &&
        command.retry_count < 3 &&
        command.processing_status !== PROCESSING_STATUS.FAILED;

    // Resolve processing status label from constant options as a fallback
    const processingLabel =
        command?.processing_status_label ??
        (command?.processing_status != null
            ? (PROCESSING_STATUS_OPTIONS.find(
                  (o) => o.value === command.processing_status,
              )?.label ?? String(command.processing_status))
            : '—');

    return (
        <Dialog open={id !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="flex w-full max-w-2xl flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex flex-wrap items-center gap-2">
                        {COMMAND_STRINGS.DIALOG_TITLE}
                        {command && (
                            <span className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                {command.id}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto pr-1">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!isLoading && error && (
                        <p className="py-8 text-center text-sm text-destructive">
                            {COMMAND_STRINGS.ERROR_LOAD_DETAIL}
                        </p>
                    )}

                    {!isLoading && !error && command && (
                        <dl className="space-y-3 py-2">
                            {/* Network */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_NETWORK}>
                                {command.network.name}
                                {command.network.network_address && (
                                    <span className="ml-1 text-muted-foreground">
                                        ({command.network.network_address})
                                    </span>
                                )}
                            </DetailRow>

                            {/* Node Address */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_NODE_ADDRESS}>
                                {command.node_address ?? '—'}
                            </DetailRow>

                            {/* Type */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_TYPE}>
                                {command.type}
                            </DetailRow>

                            {/* Endpoints */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_ENDPOINTS}>
                                <span className="font-mono">
                                    {command.source_ep ?? '—'}{' → '}{command.dest_ep ?? '—'}
                                </span>
                            </DetailRow>

                            {/* Payload */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_PAYLOAD}>
                                {command.payload ? (
                                    <span className="break-all font-mono text-xs">
                                        {command.payload}
                                    </span>
                                ) : (
                                    '—'
                                )}
                            </DetailRow>

                            {/* Packet ID */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_PACKET_ID}>
                                {command.no_packet_id
                                    ? COMMAND_STRINGS.LABEL_NO_TRACKING
                                    : (command.packet_id ?? '—')}
                            </DetailRow>

                            {/* Request ID */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_REQUEST_ID}>
                                {command.request_id != null
                                    ? String(command.request_id)
                                    : '—'}
                            </DetailRow>

                            {/* Processing Status */}
                            <DetailRow label={COMMAND_STRINGS.COL_PROCESSING_STATUS}>
                                {command.processing_status != null ? (
                                    <Badge
                                        className={cn(
                                            'text-xs',
                                            PROCESSING_STATUS_CLASSES[command.processing_status] ??
                                                'bg-gray-100 text-gray-700',
                                        )}
                                    >
                                        {processingLabel}
                                    </Badge>
                                ) : (
                                    '—'
                                )}
                            </DetailRow>

                            {/* Message Status */}
                            <DetailRow label={COMMAND_STRINGS.COL_MESSAGE_STATUS}>
                                {command.message_status_label ?? '—'}
                            </DetailRow>

                            {/* Retry Count */}
                            <DetailRow label={COMMAND_STRINGS.COL_RETRY}>
                                {COMMAND_STRINGS.RETRY_COUNT_LABEL(command.retry_count)}
                                {command.retry_at && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        ({fmtDatetime(command.retry_at)})
                                    </span>
                                )}
                            </DetailRow>

                            {/* Error */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_ERROR}>
                                {command.error_code || command.error_message ? (
                                    <span className="text-destructive">
                                        {[command.error_code, command.error_message]
                                            .filter(Boolean)
                                            .join(' — ')}
                                    </span>
                                ) : (
                                    '—'
                                )}
                            </DetailRow>

                            <Separator />

                            {/* Timestamps */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_REQUESTED_AT}>
                                {fmtDatetime(command.requested_at)}
                            </DetailRow>

                            <DetailRow label={COMMAND_STRINGS.LABEL_DISPATCHED_AT}>
                                {fmtDatetime(command.dispatched_at)}
                            </DetailRow>

                            <DetailRow label={COMMAND_STRINGS.LABEL_ACKED_AT}>
                                {fmtDatetime(command.acked_at)}
                            </DetailRow>

                            <DetailRow label={COMMAND_STRINGS.LABEL_COMPLETED_AT}>
                                {fmtDatetime(command.completed_at)}
                            </DetailRow>

                            {/* Created By */}
                            <DetailRow label={COMMAND_STRINGS.COL_CREATED_BY}>
                                {command.created_by?.name ?? '—'}
                            </DetailRow>

                            {/* Retry By */}
                            <DetailRow label={COMMAND_STRINGS.LABEL_RETRY_BY}>
                                {command.retry_by?.name ?? '—'}
                            </DetailRow>
                        </dl>
                    )}
                </ScrollArea>

                <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
                    <div>
                        {canResend && (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => void handleResend()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        {COMMAND_STRINGS.ACTION_RESENDING}
                                    </>
                                ) : (
                                    COMMAND_STRINGS.ACTION_RESEND
                                )}
                            </Button>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        {COMMAND_STRINGS.DIALOG_CLOSE}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CommandDetailDialog;
