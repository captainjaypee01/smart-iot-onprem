// src/hooks/useNodeDecommission.ts
// Custom hooks for Node Decommission module — list, history, and mutation hooks.

import { useCallback, useEffect, useState } from 'react';
import {
  getDecommissionNodes,
  getDecommissionHistory,
  decommissionNode,
  resendDecommission,
  verifyDecommission,
  manualDecommission,
} from '@/api/nodeDecommission';
import type {
  DecommissionNode,
  DecommissionNodeListResponse,
  NodeDecommissionLog,
  NodeDecommissionHistoryResponse,
  DecommissionNodePayload,
} from '@/types/nodeDecommission';
import { NODE_DECOMMISSION_STRINGS } from '@/constants/strings';

// ─── useDecommissionNodes ─────────────────────────────────────────

export interface UseDecommissionNodesParams {
  network_id: number;
  page: number;
  perPage: number;
  search?: string;
  node_type_id?: number;
  enabled?: boolean;
}

export interface UseDecommissionNodesReturn {
  nodes: DecommissionNode[];
  meta: DecommissionNodeListResponse['meta'] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDecommissionNodes = (
  params: UseDecommissionNodesParams,
): UseDecommissionNodesReturn => {
  const enabled = params.enabled !== false;
  const [data, setData] = useState<DecommissionNodeListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDecommissionNodes({
        network_id: params.network_id,
        page: params.page,
        per_page: params.perPage,
        search: params.search || undefined,
        node_type_id: params.node_type_id,
      });
      setData(response);
    } catch {
      setError(NODE_DECOMMISSION_STRINGS.ERROR_LOAD_NODES);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.network_id,
    params.page,
    params.perPage,
    params.search,
    params.node_type_id,
  ]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [load, enabled]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  return {
    nodes: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    refetch,
  };
};

// ─── useDecommissionHistory ───────────────────────────────────────

export interface UseDecommissionHistoryParams {
  network_id: number;
  page: number;
  perPage: number;
  status?: string;
  enabled?: boolean;
}

export interface UseDecommissionHistoryReturn {
  logs: NodeDecommissionLog[];
  meta: NodeDecommissionHistoryResponse['meta'] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDecommissionHistory = (
  params: UseDecommissionHistoryParams,
): UseDecommissionHistoryReturn => {
  const enabled = params.enabled !== false;
  const [data, setData] = useState<NodeDecommissionHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDecommissionHistory({
        network_id: params.network_id,
        page: params.page,
        per_page: params.perPage,
        status: params.status,
      });
      setData(response);
    } catch {
      setError(NODE_DECOMMISSION_STRINGS.ERROR_LOAD_HISTORY);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.network_id, params.page, params.perPage, params.status]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [load, enabled]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  return {
    logs: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    refetch,
  };
};

// ─── useDecommissionNode ──────────────────────────────────────────

export interface UseDecommissionNodeReturn {
  decommission: (nodeId: number, payload: DecommissionNodePayload) => Promise<NodeDecommissionLog>;
  isSubmitting: boolean;
}

export const useDecommissionNode = (): UseDecommissionNodeReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const decommission = useCallback(
    async (nodeId: number, payload: DecommissionNodePayload): Promise<NodeDecommissionLog> => {
      setIsSubmitting(true);
      try {
        const response = await decommissionNode(nodeId, payload);
        return response.data;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { decommission, isSubmitting };
};

// ─── useResendDecommission ────────────────────────────────────────

export interface UseResendDecommissionReturn {
  resend: (nodeId: number) => Promise<NodeDecommissionLog>;
  isSubmitting: boolean;
}

export const useResendDecommission = (): UseResendDecommissionReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const resend = useCallback(async (nodeId: number): Promise<NodeDecommissionLog> => {
    setIsSubmitting(true);
    try {
      const response = await resendDecommission(nodeId);
      return response.data;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { resend, isSubmitting };
};

// ─── useVerifyDecommission ────────────────────────────────────────

export interface UseVerifyDecommissionReturn {
  verify: (nodeId: number) => Promise<NodeDecommissionLog>;
  isSubmitting: boolean;
}

export const useVerifyDecommission = (): UseVerifyDecommissionReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const verify = useCallback(async (nodeId: number): Promise<NodeDecommissionLog> => {
    setIsSubmitting(true);
    try {
      const response = await verifyDecommission(nodeId);
      return response.data;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { verify, isSubmitting };
};

// ─── useManualDecommission ────────────────────────────────────────

export interface UseManualDecommissionReturn {
  manual: (nodeId: number) => Promise<NodeDecommissionLog>;
  isSubmitting: boolean;
}

export const useManualDecommission = (): UseManualDecommissionReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const manual = useCallback(async (nodeId: number): Promise<NodeDecommissionLog> => {
    setIsSubmitting(true);
    try {
      const response = await manualDecommission(nodeId);
      return response.data;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { manual, isSubmitting };
};
