// src/hooks/useGateways.ts
// Custom hooks for Gateway list, detail, and mutations.

import { useCallback, useEffect, useState } from 'react';
import {
  listGateways,
  getGateway,
  createGateway,
  updateGateway,
  deleteGateway,
  sendGatewayCommand,
} from '@/api/gateways';
import type {
  Gateway,
  GatewayListResponse,
  GatewayStatus,
  CreateGatewayPayload,
  UpdateGatewayPayload,
  SendGatewayCommandPayload,
} from '@/types/gateway';
import type { CommandRecord } from '@/types/command';
import { GATEWAY_STRINGS } from '@/constants/strings';

// ─── useGatewayList ────────────────────────────────────────────────

export interface UseGatewayListParams {
  page: number;
  perPage: number;
  network_id?: number;
  status?: GatewayStatus;
  is_test_mode?: boolean;
}

export interface UseGatewayListReturn {
  gateways: Gateway[];
  meta: GatewayListResponse['meta'] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useGatewayList = (params: UseGatewayListParams): UseGatewayListReturn => {
  const [data, setData] = useState<GatewayListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listGateways({
        page: params.page,
        per_page: params.perPage,
        network_id: params.network_id,
        status: params.status,
        is_test_mode: params.is_test_mode,
      });
      setData(response);
    } catch {
      setError(GATEWAY_STRINGS.ERROR_LOAD);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.perPage, params.network_id, params.status, params.is_test_mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  return {
    gateways: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    refetch,
  };
};

// ─── useGateway ────────────────────────────────────────────────────

export interface UseGatewayReturn {
  gateway: Gateway | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useGateway = (id: number): UseGatewayReturn => {
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getGateway(id);
      setGateway(response.data);
    } catch {
      setError(GATEWAY_STRINGS.ERROR_LOAD_DETAIL);
      setGateway(null);
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

  return { gateway, isLoading, error, refetch };
};

// ─── useCreateGateway ──────────────────────────────────────────────

export interface UseCreateGatewayReturn {
  create: (data: CreateGatewayPayload) => Promise<Gateway>;
  isSubmitting: boolean;
}

export const useCreateGateway = (): UseCreateGatewayReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const create = useCallback(async (data: CreateGatewayPayload): Promise<Gateway> => {
    setIsSubmitting(true);
    try {
      const response = await createGateway(data);
      return response.data;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { create, isSubmitting };
};

// ─── useUpdateGateway ──────────────────────────────────────────────

export interface UseUpdateGatewayReturn {
  update: (id: number, data: UpdateGatewayPayload) => Promise<Gateway>;
  isSubmitting: boolean;
}

export const useUpdateGateway = (): UseUpdateGatewayReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const update = useCallback(async (id: number, data: UpdateGatewayPayload): Promise<Gateway> => {
    setIsSubmitting(true);
    try {
      const response = await updateGateway(id, data);
      return response.data;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { update, isSubmitting };
};

// ─── useDeleteGateway ──────────────────────────────────────────────

export interface UseDeleteGatewayReturn {
  remove: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export const useDeleteGateway = (): UseDeleteGatewayReturn => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const remove = useCallback(async (id: number): Promise<void> => {
    setIsDeleting(true);
    try {
      await deleteGateway(id);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { remove, isDeleting };
};

// ─── useSendGatewayCommand ─────────────────────────────────────────

export interface UseSendGatewayCommandReturn {
  send: (gatewayId: number, data: SendGatewayCommandPayload) => Promise<CommandRecord>;
  isSubmitting: boolean;
}

export const useSendGatewayCommand = (): UseSendGatewayCommandReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const send = useCallback(
    async (gatewayId: number, data: SendGatewayCommandPayload): Promise<CommandRecord> => {
      setIsSubmitting(true);
      try {
        const response = await sendGatewayCommand(gatewayId, data);
        return response.data;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { send, isSubmitting };
};
