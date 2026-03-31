// src/types/provisioning.ts
// TypeScript types for the Node Provisioning module contract

export type ProvisioningBatchStatus = 'pending' | 'partial' | 'complete' | 'failed';
export type ProvisioningNodeStatus  = 'pending' | 'provisioned' | 'failed';

export interface ProvisioningBatchNode {
  id: number;
  service_id: string;
  node_address: string;
  status: ProvisioningNodeStatus;
  last_command_id: string | null;
  created_at: string;
}

export interface ProvisioningBatch {
  id: number;
  network: { id: number; name: string; network_address: string };
  submitted_by: { id: number; name: string } | null;
  status: ProvisioningBatchStatus;
  total_nodes: number;
  provisioned_nodes: number;
  status_summary: string;
  nodes?: ProvisioningBatchNode[];
  created_at: string;
}

export interface ProvisioningBatchListResponse {
  data: ProvisioningBatch[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    next: string | null;
    prev: string | null;
    last: string;
  };
}

export interface CreateProvisioningBatchPayload {
  network_id: number;
  target_node_id: string;
  is_auto_register?: boolean;
  nodes: { service_id: string; node_address: string }[];
}

export interface CreateProvisioningBatchResponse {
  data: {
    primary: ProvisioningBatch;
    broadcast: ProvisioningBatch;
  };
}
