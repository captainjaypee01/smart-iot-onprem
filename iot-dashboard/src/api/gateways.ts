// src/api/gateways.ts
// API functions for Gateway module endpoints

import axiosClient from './axiosClient';
import type {
  Gateway,
  GatewayListResponse,
  GatewayStatus,
  CreateGatewayPayload,
  UpdateGatewayPayload,
  SendGatewayCommandPayload,
} from '@/types/gateway';
import type { CommandRecord } from '@/types/command';

export const listGateways = async (params?: {
  page?: number;
  per_page?: number;
  network_id?: number;
  status?: GatewayStatus;
  is_test_mode?: boolean;
}): Promise<GatewayListResponse> => {
  const res = await axiosClient.get('/v1/gateways', { params });
  return res.data;
};

export const getGateway = async (id: number): Promise<{ data: Gateway }> => {
  const res = await axiosClient.get(`/v1/gateways/${id}`);
  return res.data;
};

export const createGateway = async (
  data: CreateGatewayPayload,
): Promise<{ data: Gateway }> => {
  const res = await axiosClient.post('/v1/gateways', data);
  return res.data;
};

export const updateGateway = async (
  id: number,
  data: UpdateGatewayPayload,
): Promise<{ data: Gateway }> => {
  const res = await axiosClient.patch(`/v1/gateways/${id}`, data);
  return res.data;
};

export const deleteGateway = async (id: number): Promise<void> => {
  await axiosClient.delete(`/v1/gateways/${id}`);
};

export const sendGatewayCommand = async (
  gatewayId: number,
  data: SendGatewayCommandPayload,
): Promise<{ data: CommandRecord }> => {
  const res = await axiosClient.post(`/v1/gateways/${gatewayId}/commands`, data);
  return res.data;
};
