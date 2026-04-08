// src/api/nodeDecommission.ts
// API functions for Node Decommission module endpoints.

import axiosClient from './axiosClient';
import type {
  DecommissionNodeListResponse,
  NodeDecommissionHistoryResponse,
  NodeDecommissionLog,
  DecommissionNodePayload,
} from '@/types/nodeDecommission';

export const getDecommissionNodes = async (params: {
  network_id: number;
  page?: number;
  per_page?: number;
  search?: string;
  node_type_id?: number;
}): Promise<DecommissionNodeListResponse> => {
  const res = await axiosClient.get('/v1/node-decommission/nodes', { params });
  return res.data;
};

export const getDecommissionHistory = async (params: {
  network_id: number;
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<NodeDecommissionHistoryResponse> => {
  const res = await axiosClient.get('/v1/node-decommission/history', { params });
  return res.data;
};

export const decommissionNode = async (
  nodeId: number,
  data: DecommissionNodePayload,
): Promise<{ data: NodeDecommissionLog }> => {
  const res = await axiosClient.post(`/v1/node-decommission/${nodeId}/decommission`, data);
  return res.data;
};

export const resendDecommission = async (
  nodeId: number,
): Promise<{ data: NodeDecommissionLog }> => {
  const res = await axiosClient.post(`/v1/node-decommission/${nodeId}/resend`);
  return res.data;
};

export const verifyDecommission = async (
  nodeId: number,
): Promise<{ data: NodeDecommissionLog }> => {
  const res = await axiosClient.post(`/v1/node-decommission/${nodeId}/verify`);
  return res.data;
};

export const manualDecommission = async (
  nodeId: number,
): Promise<{ data: NodeDecommissionLog }> => {
  const res = await axiosClient.post(`/v1/node-decommission/${nodeId}/manual`);
  return res.data;
};
