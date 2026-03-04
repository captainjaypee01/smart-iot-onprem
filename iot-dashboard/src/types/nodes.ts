// src/types/nodes.ts
// TypeScript interfaces for the Nodes domain — shape matches MockNode and real API

import type { DeviceStatus } from "@/types";

export type NodeStatus = DeviceStatus; // "online" | "offline" | "warning" | "error"

export interface Node {
  id: string;
  name: string;
  node_type: string;  // NODE_TYPE constant value e.g. "FIRE_EXTINGUISHER"
  config: string;     // Config scoped to the node type (e.g. "0001" | "0002" for FIRE_EXTINGUISHER).
  // Empty string "" when the node type has no config variants (e.g. FE_GAUGE_V1_3).
  building: string;
  sector: string;
  location: string;   // pre-formatted: "Building / Sector"
  status: NodeStatus;
  ip_address: string;
  last_seen: string;  // ISO 8601 — always present
}

export interface NodeListParams {
  page: number;
  per_page: number;
  search?: string;
  node_type?: string;
  status?: NodeStatus | "";
}

// Mirrors the project-wide PaginatedResponse<T> shape from src/types/index.ts
export interface NodeListResponse {
  data: Node[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}