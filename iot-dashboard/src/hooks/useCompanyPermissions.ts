// src/hooks/useCompanyPermissions.ts
// Permission helpers for the Company module, wrapping usePermission().

import { usePermission } from "@/hooks/usePermission";

export interface UseCompanyPermissionsReturn {
  canViewCompanies: () => boolean;
  canCreateCompany: () => boolean;
  canUpdateCompany: () => boolean;
  canDeleteCompany: () => boolean;
  canUploadCompanyLogo: () => boolean;
}

export const useCompanyPermissions = (): UseCompanyPermissionsReturn => {
  const { hasPermission } = usePermission();

  const canViewCompanies = () => hasPermission("company.view");
  const canCreateCompany = () => hasPermission("company.create");
  const canUpdateCompany = () => hasPermission("company.update");
  const canDeleteCompany = () => hasPermission("company.delete");
  const canUploadCompanyLogo = () => hasPermission("company.upload_logo");

  return {
    canViewCompanies,
    canCreateCompany,
    canUpdateCompany,
    canDeleteCompany,
    canUploadCompanyLogo,
  };
};

