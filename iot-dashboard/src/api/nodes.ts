// src/api/nodes.ts
// API functions for the Nodes domain endpoints

import axiosClient from "./axiosClient";
import type { NodeListParams, NodeListResponse } from "@/types/nodes";

export const getNodes = async (
  params: NodeListParams
): Promise<NodeListResponse> => {
  const res = await axiosClient.get<NodeListResponse>("/nodes", { params });
  return res.data;
};
