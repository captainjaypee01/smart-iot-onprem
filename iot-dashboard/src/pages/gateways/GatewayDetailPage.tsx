// src/pages/gateways/GatewayDetailPage.tsx
// Detail view for a single Gateway.
// Access is role-based (gateway.view permission) — not superadmin-only.

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGateway } from '@/hooks/useGateways';
import { useGatewayPermissions } from '@/hooks/useGatewayPermissions';
import type { GatewayStatus } from '@/types/gateway';
import {
  GATEWAY_STRINGS,
  GATEWAY_STATUS_LABELS,
  UI_STRINGS,
} from '@/constants/strings';
import { cn } from '@/lib/utils';
import GatewayFormDialog from './GatewayFormDialog';
import SendGatewayCommandDialog from './SendGatewayCommandDialog';

// ─── Status badge colours ──────────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<GatewayStatus, string> = {
  online: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  offline: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  unknown: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
} as const;

// ─── Helper — info row ─────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
    <span className="min-w-[140px] text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground">{value}</span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────

const GatewayDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const gatewayId = Number(id);

  const { gateway, isLoading, error, refetch } = useGateway(gatewayId);
  const { canUpdate, canSendCommand } = useGatewayPermissions();

  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [commandOpen, setCommandOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="border-brand-blue h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (error || !gateway) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">
          {error ?? GATEWAY_STRINGS.ERROR_LOAD_DETAIL}
        </p>
        <Button asChild variant="outline">
          <Link to="/gateways">{GATEWAY_STRINGS.BACK_TO_GATEWAYS}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Back + actions header ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" aria-label={GATEWAY_STRINGS.BACK_TO_GATEWAYS}>
            <Link to="/gateways">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {gateway.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {GATEWAY_STRINGS.DETAIL_SUBTITLE}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSendCommand() && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setCommandOpen(true)}
            >
              <Terminal className="h-4 w-4" />
              {GATEWAY_STRINGS.SEND_COMMAND}
            </Button>
          )}
          {canUpdate() && (
            <Button
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Edit3 className="h-4 w-4" />
              {GATEWAY_STRINGS.EDIT_GATEWAY}
            </Button>
          )}
        </div>
      </div>

      {/* ── Detail card ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{GATEWAY_STRINGS.TITLE}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow
            label={GATEWAY_STRINGS.COL_GATEWAY_ID}
            value={
              <Badge variant="outline" className="font-mono text-xs">
                {gateway.gateway_id}
              </Badge>
            }
          />
          <InfoRow
            label={GATEWAY_STRINGS.COL_SINK_ID}
            value={<span className="font-mono text-sm">{gateway.sink_id}</span>}
          />
          <InfoRow
            label={GATEWAY_STRINGS.COL_NETWORK}
            value={`${gateway.network.name} (${gateway.network.network_address})`}
          />
          <InfoRow
            label={GATEWAY_STRINGS.LABEL_STATUS}
            value={
              <Badge className={cn('text-xs', STATUS_BADGE_CLASSES[gateway.status])}>
                {GATEWAY_STATUS_LABELS[gateway.status]}
              </Badge>
            }
          />
          <InfoRow
            label={GATEWAY_STRINGS.LABEL_IS_TEST_MODE}
            value={
              gateway.is_test_mode ? (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs">
                  {GATEWAY_STRINGS.TEST_MODE_ON}
                </Badge>
              ) : (
                <span className="text-muted-foreground">{UI_STRINGS.NO}</span>
              )
            }
          />
          <InfoRow
            label={GATEWAY_STRINGS.LABEL_LAST_SEEN}
            value={
              gateway.last_seen_at
                ? new Date(gateway.last_seen_at).toLocaleString()
                : GATEWAY_STRINGS.NEVER_SEEN
            }
          />
          {gateway.service_id && (
            <InfoRow
              label={GATEWAY_STRINGS.LABEL_SERVICE_ID}
              value={gateway.service_id}
            />
          )}
          {gateway.asset_id && (
            <InfoRow
              label={GATEWAY_STRINGS.LABEL_ASSET_ID}
              value={gateway.asset_id}
            />
          )}
          {gateway.device_key && (
            <InfoRow
              label={GATEWAY_STRINGS.LABEL_DEVICE_KEY}
              value={gateway.device_key}
            />
          )}
          {gateway.location && (
            <InfoRow
              label={GATEWAY_STRINGS.LABEL_LOCATION}
              value={gateway.location}
            />
          )}
          {gateway.gateway_version && (
            <InfoRow
              label={GATEWAY_STRINGS.LABEL_GATEWAY_VERSION}
              value={gateway.gateway_version}
            />
          )}
          <InfoRow
            label={GATEWAY_STRINGS.LABEL_IP_ADDRESS}
            value={
              gateway.ip_address ? (
                <span className="font-mono text-sm">{gateway.ip_address}</span>
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  {GATEWAY_STRINGS.IP_ADDRESS_HELPER}
                </span>
              )
            }
          />
          {gateway.description && (
            <InfoRow
              label={GATEWAY_STRINGS.LABEL_DESCRIPTION}
              value={gateway.description}
            />
          )}
          <InfoRow
            label={GATEWAY_STRINGS.LABEL_CREATED_AT}
            value={new Date(gateway.created_at).toLocaleString()}
          />
          <InfoRow
            label={GATEWAY_STRINGS.LABEL_UPDATED_AT}
            value={new Date(gateway.updated_at).toLocaleString()}
          />
        </CardContent>
      </Card>

      {/* ── Dialogs ─────────────────────────────────────────────── */}
      {/* networkOptions not needed: detail page only opens the dialog in edit mode,
          which never renders the network selector. */}
      <GatewayFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        gateway={gateway}
        onSuccess={() => void refetch()}
        networkOptions={[]}
        networksLoading={false}
      />

      <SendGatewayCommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        gateway={gateway}
      />
    </div>
  );
};

export default GatewayDetailPage;
