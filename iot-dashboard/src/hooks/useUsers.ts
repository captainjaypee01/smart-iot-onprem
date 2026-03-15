// src/hooks/useUsers.ts
// Fetches the users list with server-side pagination (page + per_page). Refetches when page or perPage changes.

import { useState, useCallback, useEffect } from "react";
import { getUsers } from "@/api/users";
import type { User } from "@/types/user";
import type { PaginatedResponse } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/constants";

export interface UseUsersReturn {
    users: User[];
    meta: PaginatedResponse<User>["meta"] | null;
    page: number;
    setPage: (page: number) => void;
    perPage: number;
    setPerPage: (perPage: number) => void;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useUsers = (): UseUsersReturn => {
    const [data, setData] = useState<PaginatedResponse<User> | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPageState] = useState<number>(DEFAULT_PAGE_SIZE);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (p: number, pp: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getUsers(p, pp);
            setData(res);
        } catch {
            setError("Failed to load users.");
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load(page, perPage);
    }, [page, perPage, load]);

    const refetch = useCallback(async () => {
        await load(page, perPage);
    }, [load, page, perPage]);

    const setPerPage = useCallback((pp: number) => {
        setPerPageState(pp);
        setPage(1);
    }, []);

    return {
        users: data?.data ?? [],
        meta: data?.meta ?? null,
        page,
        setPage,
        perPage,
        setPerPage,
        isLoading,
        error,
        refetch,
    };
};
