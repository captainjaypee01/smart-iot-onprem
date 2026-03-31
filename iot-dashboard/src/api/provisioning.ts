// src/api/provisioning.ts
// API functions for the Node Provisioning module endpoints

import axiosClient from './axiosClient';
import type {
  CreateProvisioningBatchPayload,
  CreateProvisioningBatchResponse,
  ProvisioningBatch,
  ProvisioningBatchListResponse,
  ProvisioningBatchNode,
} from '@/types/provisioning';

export const getProvisioningBatches = async (params?: {
  page?: number;
  per_page?: number;
  network_id?: number;
  status?: string;
}): Promise<ProvisioningBatchListResponse> => {
  const res = await axiosClient.get('/v1/provisioning', { params });
  return res.data;
};

export const getProvisioningBatch = async (
  id: number,
): Promise<{ data: ProvisioningBatch }> => {
  const res = await axiosClient.get(`/v1/provisioning/${id}`);
  return res.data;
};

export const createProvisioningBatch = async (
  payload: CreateProvisioningBatchPayload,
): Promise<CreateProvisioningBatchResponse> => {
  const res = await axiosClient.post('/v1/provisioning', payload);
  return res.data;
};

export const resendProvisioningNode = async (
  batchId: number,
  nodeId: number,
): Promise<{ data: ProvisioningBatchNode }> => {
  const res = await axiosClient.post(
    `/v1/provisioning/${batchId}/nodes/${nodeId}/resend`,
  );
  return res.data;
};
