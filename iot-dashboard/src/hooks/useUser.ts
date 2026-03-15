// src/hooks/useUser.ts
// Fetches a single user by id; caller triggers load (e.g. when dialog opens)

import { useState, useCallback } from "react";
import { getUserById } from "@/api/users";
import type { User } from "@/types/user";

export interface UseUserReturn {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    fetchUser: (id: number) => Promise<void>;
    clear: () => void;
}

export const useUser = (): UseUserReturn => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserById(id);
            setUser(data);
        } catch {
            setError("Failed to load user.");
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clear = useCallback(() => {
        setUser(null);
        setError(null);
    }, []);

    return { user, isLoading, error, fetchUser, clear };
};
