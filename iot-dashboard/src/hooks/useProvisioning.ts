// src/hooks/useProvisioning.ts
// Query and mutation hooks for the Node Provisioning module

import { useCallback, useEffect, useState } from 'react';
import {
  getProvisioningBatches,
  getProvisioningBatch,
  createProvisioningBatch,
  resendProvisioningNode,
} from '@/api/provisioning';
import type {
  CreateProvisioningBatchPayload,
  CreateProvisioningBatchResponse,
  ProvisioningBatch,
  ProvisioningBatchListResponse,
  ProvisioningBatchNode,
} from '@/types/provisioning';

// ─── useProvisioningBatches ───────────────────────────────────────────────────

interface UseProvisioningBatchesParams {
  page?: number;
  per_page?: number;
  network_id?: number;
  status?: string;
}

interface UseProvisioningBatchesReturn {
  batches: ProvisioningBatch[];
  meta: ProvisioningBatchListResponse['meta'] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProvisioningBatches = (
  params?: UseProvisioningBatchesParams,
): UseProvisioningBatchesReturn => {
  const [data, setData] = useState<ProvisioningBatchListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getProvisioningBatches(params);
      setData(response);
    } catch {
      setError('Failed to load provisioning batches.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [params?.page, params?.per_page, params?.network_id, params?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  return {
    batches: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    refetch,
  };
};

// ─── useProvisioningBatch ────────────────────────────────────────────────────

interface UseProvisioningBatchReturn {
  batch: ProvisioningBatch | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProvisioningBatch = (
  id: number,
): UseProvisioningBatchReturn => {
  const [batch, setBatch] = useState<ProvisioningBatch | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getProvisioningBatch(id);
      setBatch(response.data);
    } catch {
      setError('Failed to load provisioning batch.');
      setBatch(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  return { batch, isLoading, error, refetch };
};

// ─── useCreateProvisioningBatch ───────────────────────────────────────────────

interface UseCreateProvisioningBatchReturn {
  create: (payload: CreateProvisioningBatchPayload) => Promise<CreateProvisioningBatchResponse>;
  isSubmitting: boolean;
}

export const useCreateProvisioningBatch = (): UseCreateProvisioningBatchReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const create = useCallback(
    async (payload: CreateProvisioningBatchPayload): Promise<CreateProvisioningBatchResponse> => {
      setIsSubmitting(true);
      try {
        return await createProvisioningBatch(payload);
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { create, isSubmitting };
};

// ─── useResendProvisioningNode ────────────────────────────────────────────────

interface UseResendProvisioningNodeReturn {
  resend: (batchId: number, nodeId: number) => Promise<ProvisioningBatchNode>;
  isSubmitting: boolean;
}

export const useResendProvisioningNode = (): UseResendProvisioningNodeReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const resend = useCallback(
    async (batchId: number, nodeId: number): Promise<ProvisioningBatchNode> => {
      setIsSubmitting(true);
      try {
        const response = await resendProvisioningNode(batchId, nodeId);
        return response.data;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { resend, isSubmitting };
};
