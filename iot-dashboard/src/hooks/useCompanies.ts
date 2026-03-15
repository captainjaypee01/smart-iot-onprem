// src/hooks/useCompanies.ts
// Fetches companies for dropdowns (user create). Uses /companies/options (not paginated).

import { useState, useCallback, useEffect } from "react";
import { getCompanyOptions } from "@/api/companies";
import type { CompanyOption } from "@/api/settings";

export interface UseCompaniesReturn {
    companies: CompanyOption[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useCompanies = (): UseCompaniesReturn => {
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCompanyOptions();
            setCompanies(data);
        } catch {
            setError("Failed to load companies.");
            setCompanies([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { companies, isLoading, error, refetch };
};

