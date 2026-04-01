// src/hooks/useCommands.ts
// Data-fetching and mutation hooks for the Command Console module.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getCommand, getCommands, resendCommand, sendCommand } from '@/api/commands';
import type {
    CommandFilters,
    CommandListResponse,
    CommandRecord,
    SendCommandPayload,
} from '@/types/command';

const AUTO_REFRESH_INTERVAL_MS = 15_000;

// ─── useCommands ──────────────────────────────────────────────────
// Paginated command history list with optional filter state and auto-refresh.

export interface UseCommandsReturn {
    commands: CommandRecord[];
    meta: CommandListResponse['meta'] | null;
    isLoading: boolean;
    error: string | null;
    page: number;
    setPage: (page: number) => void;
    perPage: number;
    setPerPage: (perPage: number) => void;
    filters: CommandFilters;
    setFilters: (filters: CommandFilters) => void;
    autoRefresh: boolean;
    setAutoRefresh: (on: boolean) => void;
    refetch: () => Promise<void>;
}

export const useCommands = (): UseCommandsReturn => {
    const [data, setData] = useState<CommandListResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPageState] = useState<number>(1);
    const [perPage, setPerPageState] = useState<number>(15);
    const [filters, setFiltersState] = useState<CommandFilters>({});
    const [autoRefresh, setAutoRefreshState] = useState<boolean>(true);

    // Keep a ref to the interval so we can clear it on unmount / toggle off.
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getCommands({
                ...filters,
                page,
                per_page: perPage,
            });
            setData(response);
        } catch {
            setError('Failed to load commands.');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [filters, page, perPage]);

    // Initial load and re-load whenever dependencies change.
    useEffect(() => {
        void load();
    }, [load]);

    // Auto-refresh: set up / tear down an interval when the toggle changes.
    useEffect(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (autoRefresh) {
            intervalRef.current = setInterval(() => {
                void load();
            }, AUTO_REFRESH_INTERVAL_MS);
        }

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoRefresh, load]);

    const refetch = useCallback(async () => {
        await load();
    }, [load]);

    const setPage = useCallback((p: number) => {
        setPageState(p);
    }, []);

    const setPerPage = useCallback((pp: number) => {
        setPerPageState(pp);
        setPageState(1); // reset to page 1 when page size changes
    }, []);

    const setFilters = useCallback((f: CommandFilters) => {
        setFiltersState(f);
        setPageState(1); // reset to page 1 when filters change
    }, []);

    const setAutoRefresh = useCallback((on: boolean) => {
        setAutoRefreshState(on);
    }, []);

    return {
        commands: data?.data ?? [],
        meta: data?.meta ?? null,
        isLoading,
        error,
        page,
        setPage,
        perPage,
        setPerPage,
        filters,
        setFilters,
        autoRefresh,
        setAutoRefresh,
        refetch,
    };
};

// ─── useSendCommand ───────────────────────────────────────────────

export interface UseSendCommandReturn {
    send: (payload: SendCommandPayload) => Promise<CommandRecord>;
    isSubmitting: boolean;
}

export const useSendCommand = (): UseSendCommandReturn => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const send = useCallback(
        async (payload: SendCommandPayload): Promise<CommandRecord> => {
            setIsSubmitting(true);
            try {
                return await sendCommand(payload);
            } finally {
                setIsSubmitting(false);
            }
        },
        [],
    );

    return { send, isSubmitting };
};

// ─── useCommand ───────────────────────────────────────────────────
// Fetches a single command by ID. Triggers when `id` changes.

export interface UseCommandReturn {
    command: CommandRecord | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useCommand = (id: string | null): UseCommandReturn => {
    const [command, setCommand] = useState<CommandRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCommand(id);
            setCommand(data);
        } catch {
            setError('Failed to load command details.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    const refetch = useCallback(async () => { await load(); }, [load]);

    return { command, isLoading, error, refetch };
};

// ─── useResendCommand ─────────────────────────────────────────────

export interface UseResendCommandReturn {
    resend: (id: string) => Promise<CommandRecord>;
    isSubmitting: boolean;
}

export const useResendCommand = (): UseResendCommandReturn => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const resend = useCallback(async (id: string): Promise<CommandRecord> => {
        setIsSubmitting(true);
        try {
            return await resendCommand(id);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { resend, isSubmitting };
};
