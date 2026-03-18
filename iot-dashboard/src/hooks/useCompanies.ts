// src/hooks/useCompanies.ts
// Company data hooks: paginated index, single company, and options list.

import { useState, useCallback, useEffect } from "react";
import {
  getCompanies,
  getCompany,
  getCompanyOptions,
  deleteCompany,
  updateCompany,
  uploadCompanyLogo,
} from "@/api/companies";
import type {
  Company,
  CompanyListResponse,
  CompanyOption,
  UpdateOwnCompanyPayload,
} from "@/types/company";
import { UI_STRINGS } from "@/constants/strings";

export interface CompaniesQueryParams {
  page: number;
  perPage: number;
  search?: string;
  isActive?: boolean;
  isDemo?: boolean;
}

export interface UseCompaniesReturn {
  companies: Company[];
  meta: CompanyListResponse["meta"] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCompanies = (params: CompaniesQueryParams): UseCompaniesReturn => {
  const { page, perPage, search, isActive, isDemo } = params;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [meta, setMeta] = useState<CompanyListResponse["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCompanies({
        page,
        per_page: perPage,
        search: search && search.trim().length > 0 ? search.trim() : undefined,
        is_active: isActive === undefined ? undefined : (isActive ? 1 : 0),
        is_demo: isDemo === undefined ? undefined : (isDemo ? 1 : 0),
      });
      setCompanies(response.data);
      setMeta(response.meta);
    } catch {
      setError(UI_STRINGS.ERROR_GENERIC);
      setCompanies([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, isActive, isDemo]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { companies, meta, isLoading, error, refetch };
};

export interface UseCompanyReturn {
  company: Company | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCompany = (id: number | null): UseCompanyReturn => {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (id == null) {
      setCompany(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCompany(id);
      setCompany(response);
    } catch {
      setError(UI_STRINGS.ERROR_GENERIC);
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { company, isLoading, error, refetch };
};

export interface UseCompanyOptionsReturn {
  options: CompanyOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCompanyOptions = (): UseCompanyOptionsReturn => {
  const [options, setOptions] = useState<CompanyOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCompanyOptions();
      setOptions(response.data);
    } catch {
      setError(UI_STRINGS.ERROR_GENERIC);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { options, isLoading, error, refetch };
};

export const useDeleteCompany = () => {
  const remove = useCallback(async (id: number): Promise<void> => {
    await deleteCompany(id);
  }, []);

  return { deleteCompany: remove };
};

export const useUpdateOwnCompany = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const updateOwnCompany = useCallback(
    async (id: number, payload: UpdateOwnCompanyPayload): Promise<Company> => {
      setIsSubmitting(true);
      try {
        const response = await updateCompany(id, payload);
        return response.data;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { updateOwnCompany, isSubmitting };
};

export const useUploadCompanyLogo = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const uploadLogo = useCallback(
    async (id: number, file: File): Promise<Company> => {
      setIsUploading(true);
      try {
        const response = await uploadCompanyLogo(id, file);
        return response.data;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return { uploadCompanyLogo: uploadLogo, isUploading };
};

