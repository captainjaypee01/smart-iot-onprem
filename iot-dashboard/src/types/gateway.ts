// src/types/gateway.ts
// TypeScript types for the Gateway module contract

export type GatewayStatus = 'online' | 'offline' | 'unknown';

export type GatewayCommandType =
  | 'get_configs'
  | 'otap_load_scratchpad'
  | 'otap_process_scratchpad'
  | 'otap_set_target_scratchpad'
  | 'otap_status'
  | 'upload_software_update'
  | 'diagnostic'
  | 'sync_gateway_time'
  | 'renew_certificate'
  | 'restart_gateway';

export interface GatewayNetwork {
  id: number;
  name: string;
  network_address: string;
}

export interface Gateway {
  id: number;
  network_id: number;
  network: GatewayNetwork;
  gateway_id: string;
  sink_id: string;
  service_id: string | null;
  asset_id: string | null;
  device_key: string | null;
  location: string | null;
  ip_address: string | null;
  gateway_version: string | null;
  name: string;
  description: string | null;
  is_test_mode: boolean;
  status: GatewayStatus;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GatewayListResponse {
  data: Gateway[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string | null;
    next: string | null;
    prev: string | null;
    last: string | null;
  };
}

export interface CreateGatewayPayload {
  network_id: number;
  name: string;
  service_id: string;
  description?: string | null;
  is_test_mode?: boolean;
  gateway_prefix?: string;
  asset_id?: string | null;
  device_key?: string | null;
  location?: string | null;
}

export interface UpdateGatewayPayload {
  name?: string;
  description?: string | null;
  is_test_mode?: boolean;
  service_id?: string;
  asset_id?: string | null;
  device_key?: string | null;
  location?: string | null;
}

export interface SendGatewayCommandPayload {
  type: GatewayCommandType;
  diagnostic_type?: string | null;
  service_name?: string | null;
}

export const DIAGNOSTIC_TYPES = [
  { value: 'check_utilization', label: 'Check Utilization' },
  { value: 'current_time', label: 'Current Time' },
  { value: 'sync_time', label: 'Sync Time' },
  { value: 'network_id_not_ok', label: 'Network ID Not OK' },
  { value: 'local_environment_settings', label: 'Local Environment Settings' },
  { value: 'check_sim_imei', label: 'Check SIM / IMEI' },
  { value: 'upload_file', label: 'Upload Log Files' },
  { value: 'service_restart', label: 'Restart Service' },
] as const;

export const SERVICE_NAMES = [
  { value: 'wirepasSink1', label: 'Wirepas Sink' },
  { value: 'wirepasTransport', label: 'Wirepas Transport' },
  { value: 'watchdog', label: 'Watchdog' },
  { value: 'fail2ban', label: 'Fail2ban' },
  { value: 'redis', label: 'Redis' },
  { value: 'restart_hat', label: '4G Hat' },
  { value: 'qmi_reconnect', label: 'QMI Reconnect' },
  { value: 'rsyslog', label: 'Log Rotation (rsyslog)' },
] as const;
