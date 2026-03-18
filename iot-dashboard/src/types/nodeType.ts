// src/types/nodeType.ts
// TypeScript interfaces for Node Type module

export interface NodeTypeSensor {
  slot: number;
  name: string;
  unit: string | null;
}

export interface NodeType {
  id: number;
  name: string;
  area_id: string;
  description: string | null;
  sensors: NodeTypeSensor[];
  sensor_count: number;
  created_at: string;
  updated_at: string;
}

export interface NodeTypeListResponse {
  data: NodeType[];
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

export interface NodeTypeOption {
  id: number;
  name: string;
  area_id: string;
}

export interface SensorSlotPayload {
  name: string;
  unit?: string | null;
}

export interface StoreNodeTypePayload {
  name: string;
  area_id: string;
  description?: string | null;
  sensors?: SensorSlotPayload[];
}

export type UpdateNodeTypePayload = Partial<StoreNodeTypePayload>;

