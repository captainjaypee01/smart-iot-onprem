// src/types/nodeDecommission.ts
// TypeScript types for the Node Decommission module.
// Mirrors the shapes defined in docs/specs/node-decommission-module-contract.md.

export type NodeDecommissionLogStatus = 'pending' | 'completed' | 'failed' | 'manual';

export interface LatestDecommissionLog {
  id: number;
  status: NodeDecommissionLogStatus;
  is_manual: boolean;
  /** True when decommission has been pending for 2+ min with no verify sent yet → show "Verify" button */
  decommission_timed_out: boolean;
  /** True when verify command timed out (node didn't reply) → show "Manual Decommission" button */
  verification_timed_out: boolean;
  /** Set once verify command is sent */
  verification_sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface DecommissionNode {
  id: number;
  name: string;
  node_address: string;
  service_id: string;
  status: 'new' | 'active';
  network: { id: number; name: string; network_address: string };
  latest_decommission_log: LatestDecommissionLog | null;
}

export interface NodeDecommissionLog {
  id: number;
  node: { id: number; name: string; node_address: string; service_id: string; status: 'new' | 'active' | 'decommissioned' };
  network: { id: number; name: string; network_address: string };
  initiated_by: { id: number; name: string } | null;
  status: NodeDecommissionLogStatus;
  is_manual: boolean;
  command_id: number | null;
  verification_command_id: number | null;
  packet_id: string | null;
  /** Hardcoded decommission command: 0e05446f697421 */
  payload: string | null;
  verification_packet_id: string | null;
  verification_sent_at: string | null;
  verification_expires_at: string | null;
  decommission_timed_out: boolean;
  verification_timed_out: boolean;
  error_message: string | null;
  decommissioned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecommissionNodeListResponse {
  data: DecommissionNode[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  links: { first: string; next: string | null; prev: string | null; last: string };
}

export interface NodeDecommissionHistoryResponse {
  data: NodeDecommissionLog[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  links: { first: string; next: string | null; prev: string | null; last: string };
}

/** Only network_id is sent — payload is hardcoded server-side */
export interface DecommissionNodePayload {
  network_id: number;
}
