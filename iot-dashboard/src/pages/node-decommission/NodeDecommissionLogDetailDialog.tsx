// src/pages/node-decommission/NodeDecommissionLogDetailDialog.tsx
// Read-only detail dialog for a single NodeDecommissionLog row.
// Shows all fields including linked command IDs for monitoring.

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { NodeDecommissionLog, NodeDecommissionLogStatus } from '@/types/nodeDecommission';
import { NODE_DECOMMISSION_STRINGS, UI_STRINGS } from '@/constants/strings';
import { cn } from '@/lib/utils';

// ─── Badge helpers (duplicated from page to keep dialog self-contained) ───────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-x-3 gap-y-1 items-start py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm break-all">{children}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {title}
      </p>
      {children}
    </div>
  );
}

function Mono({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">{UI_STRINGS.N_A}</span>;
  return <span className="font-mono">{value}</span>;
}

function DateCell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">{UI_STRINGS.N_A}</span>;
  return <>{new Date(value).toLocaleString()}</>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface NodeDecommissionLogDetailDialogProps {
  log: NodeDecommissionLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NodeDecommissionLogDetailDialog = ({
  log,
  open,
  onOpenChange,
}: NodeDecommissionLogDetailDialogProps) => {
  if (!log) return null;

  const fullFrame = log.packet_id && log.payload
    ? `${log.packet_id}${log.payload}`
    : null;

  const verifyFullFrame = log.verification_packet_id && log.verification_sent_at
    ? `${log.verification_packet_id}0501ff`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {NODE_DECOMMISSION_STRINGS.DETAIL_DIALOG_TITLE}
            <Badge className={cn('text-xs', LOG_STATUS_CLASSES[log.status])}>
              {LOG_STATUS_LABELS[log.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          {/* Node */}
          <Section title={NODE_DECOMMISSION_STRINGS.DETAIL_SECTION_NODE}>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_NODE_NAME}>
              {log.node.name}
            </Row>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_SERVICE_ID}>
              <Mono value={log.node.service_id} />
            </Row>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_NODE_ADDRESS}>
              <Mono value={log.node.node_address} />
            </Row>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_INITIATED_BY}>
              {log.initiated_by?.name ?? NODE_DECOMMISSION_STRINGS.INITIATED_BY_UNKNOWN}
            </Row>
          </Section>

          {/* Decommission command */}
          <Section title={NODE_DECOMMISSION_STRINGS.DETAIL_SECTION_DECOMMISSION}>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_PACKET_ID}>
              <Mono value={log.packet_id} />
            </Row>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_PAYLOAD}>
              <Mono value={log.payload} />
            </Row>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_FULL_FRAME}>
              <Mono value={fullFrame} />
            </Row>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_COMMAND_ID}>
              {log.command_id !== null
                ? <Mono value={String(log.command_id)} />
                : <span className="text-muted-foreground">{UI_STRINGS.N_A}</span>}
            </Row>
          </Section>

          {/* Verification command */}
          <Section title={NODE_DECOMMISSION_STRINGS.DETAIL_SECTION_VERIFICATION}>
            {log.verification_sent_at ? (
              <>
                <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_VERIFY_PACKET_ID}>
                  <Mono value={log.verification_packet_id} />
                </Row>
                <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_VERIFY_PAYLOAD}>
                  <Mono value="0501ff" />
                </Row>
                <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_FULL_FRAME}>
                  <Mono value={verifyFullFrame} />
                </Row>
                <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_VERIFY_COMMAND_ID}>
                  {log.verification_command_id !== null
                    ? <Mono value={String(log.verification_command_id)} />
                    : <span className="text-muted-foreground">{UI_STRINGS.N_A}</span>}
                </Row>
                <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_VERIFY_SENT_AT}>
                  <DateCell value={log.verification_sent_at} />
                </Row>
                <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_VERIFY_EXPIRES_AT}>
                  <DateCell value={log.verification_expires_at} />
                </Row>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {NODE_DECOMMISSION_STRINGS.DETAIL_NO_VERIFY_SENT}
              </p>
            )}
          </Section>

          {/* Timestamps & outcome */}
          <Section title={NODE_DECOMMISSION_STRINGS.DETAIL_SECTION_TIMESTAMPS}>
            {log.error_message && (
              <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_ERROR}>
                <span className="text-destructive">{log.error_message}</span>
              </Row>
            )}
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_DECOMMISSIONED_AT}>
              <DateCell value={log.decommissioned_at} />
            </Row>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_CREATED_AT}>
              <DateCell value={log.created_at} />
            </Row>
            <Row label={NODE_DECOMMISSION_STRINGS.DETAIL_LABEL_UPDATED_AT}>
              <DateCell value={log.updated_at} />
            </Row>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeDecommissionLogDetailDialog;
