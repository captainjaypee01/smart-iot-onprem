// src/api/nodeTypes.ts
// API functions for Node Type module endpoints

import axiosClient from "./axiosClient";
import type {
  NodeType,
  NodeTypeListResponse,
  NodeTypeOption,
  StoreNodeTypePayload,
  UpdateNodeTypePayload,
} from "@/types/nodeType";

export const getNodeTypes = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<NodeTypeListResponse> => {
  const res = await axiosClient.get("/v1/node-types", { params });
  return res.data;
};

export const getNodeTypeOptions = async (): Promise<{ data: NodeTypeOption[] }> => {
  const res = await axiosClient.get("/v1/node-types/options");
  return res.data;
};

export const getNodeType = async (id: number): Promise<{ data: NodeType }> => {
  const res = await axiosClient.get(`/v1/node-types/${id}`);
  return res.data;
};

export const createNodeType = async (
  payload: StoreNodeTypePayload,
): Promise<{ data: NodeType }> => {
  const res = await axiosClient.post("/v1/node-types", payload);
  return res.data;
};

export const updateNodeType = async (
  id: number,
  payload: UpdateNodeTypePayload,
): Promise<{ data: NodeType }> => {
  const res = await axiosClient.put(`/v1/node-types/${id}`, payload);
  return res.data;
};

export const deleteNodeType = async (id: number): Promise<void> => {
  await axiosClient.delete(`/v1/node-types/${id}`);
};

