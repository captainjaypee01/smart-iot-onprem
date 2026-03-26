// src/hooks/useRoleForm.ts
// Encapsulates all data-fetching and state for the Role form page.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ROLE_STRINGS } from "@/constants/strings";
import type { Role } from "@/types/role";
import type { FeatureGroup } from "@/types/feature";
import type { PermissionGroup } from "@/types/permission";
import type { NetworkOption } from "@/types/network";
import type { CompanyOption } from "@/types/company";

import { useAuthStore } from "@/store/authStore";
import { useCompanyOptions } from "@/hooks/useCompanies";
import { useRole as useRoleData } from "@/hooks/useRoles";
import { useRoleFeaturesOptions } from "@/hooks/useRoleFeaturesOptions";
import { useRolePermissionsGrouped } from "@/hooks/useRolePermissionsGrouped";
import { useRoleNetworksOptions } from "@/hooks/useRoleNetworksOptions";
import { useCreateRole, useUpdateRole } from "@/hooks/useRoleMutations";

export interface UseRoleFormOptions {
    roleId?: number;
}

export interface UseRoleFormReturn {
    // existing role data (edit mode only)
    role: Role | null;
    isLoadingRole: boolean;

    // form state
    name: string;
    setName: (v: string) => void;
    companyIds: Set<number>;
    toggleCompany: (companyId: number, checked: boolean) => void;
    isSystemRole: boolean;
    setIsSystemRole: (v: boolean) => void;

    // selection state
    selectedFeatureIds: Set<number>;
    selectedPermissionIds: Set<number>;
    selectedNetworkIds: Set<number>;
    toggleFeature: (id: number, checked: boolean) => void;
    togglePermission: (id: number, checked: boolean) => void;
    toggleNetwork: (id: number, checked: boolean) => void;
    toggleAllFeatures: (ids: number[], checked: boolean) => void;
    toggleAllPermissions: (ids: number[], checked: boolean) => void;

    // options data
    featureGroups: FeatureGroup[];
    isLoadingFeatures: boolean;
    permissionGroups: PermissionGroup[];
    isLoadingPermissions: boolean;
    networkOptions: NetworkOption[];
    isLoadingNetworks: boolean;
    companyOptions: CompanyOption[];
    isLoadingCompanies: boolean;

    // submit
    handleSubmit: () => Promise<void>;
    isSubmitting: boolean;
}

export const useRoleForm = ({ roleId }: UseRoleFormOptions): UseRoleFormReturn => {
    const navigate = useNavigate();

    const user = useAuthStore((s) => s.user);
    const isSuperAdmin = user?.is_superadmin ?? false;
    const userCompanyId = user?.company?.id ?? null;

    const { role, isLoading: isLoadingRole } = useRoleData(roleId ?? null);

    const [name, setName] = useState<string>("");
    const [companyIds, setCompanyIds] = useState<Set<number>>(
        userCompanyId != null ? new Set([userCompanyId]) : new Set(),
    );
    const [isSystemRole, setIsSystemRole] = useState<boolean>(false);

    const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<number>>(
        new Set(),
    );
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(
        new Set(),
    );
    const [selectedNetworkIds, setSelectedNetworkIds] = useState<Set<number>>(
        new Set(),
    );

    const isPrefillingRef = useRef<boolean>(false);

    // Options (features / permissions / companies)
    const {
        groups: featureGroups,
        isLoading: isLoadingFeatures,
    } = useRoleFeaturesOptions(true);
    const {
        groups: permissionGroups,
        isLoading: isLoadingPermissions,
    } = useRolePermissionsGrouped(true);
    const { options: companyOptions, isLoading: isLoadingCompanies } = useCompanyOptions();

    const companyIdsArray = useMemo(() => Array.from(companyIds), [companyIds]);

    // Networks options:
    // - superadmin fetches /v1/networks/options scoped by the selected companies
    //   and unions + dedupes them
    // - company admin falls back to networks available in /auth/me
    const shouldFetchSuperadminNetworks = isSuperAdmin && companyIds.size > 0;
    const {
        options: apiNetworkOptions,
        isLoading: isLoadingNetworks,
    } = useRoleNetworksOptions(shouldFetchSuperadminNetworks, companyIdsArray);

    const networkOptions: NetworkOption[] = useMemo(() => {
        if (isSuperAdmin) return apiNetworkOptions;

        const networks = user?.networks ?? [];
        return (networks as Array<{ id: number; name: string; network_address: string }>).map(
            (n) => ({
                id: n.id,
                name: n.name,
                network_address: n.network_address,
                is_active: true,
            }),
        );
    }, [apiNetworkOptions, isSuperAdmin, user?.networks]);

    // Keep companyIds aligned for non-superadmin users (who can't change it).
    useEffect(() => {
        if (roleId != null) return;
        if (companyIds.size > 0) return;
        if (userCompanyId == null) return;
        setCompanyIds(new Set([userCompanyId]));
    }, [companyIds.size, roleId, userCompanyId]);

    // Prefill on edit.
    useEffect(() => {
        if (roleId == null) return;
        if (!role) return;

        isPrefillingRef.current = true;
        setName(role.name);
        const roleCompanies = role.companies ?? (role.company ? [role.company] : []);
        setCompanyIds(new Set(roleCompanies.map((c) => c.id)));
        setIsSystemRole(role.is_system_role);

        setSelectedFeatureIds(new Set(role.features.map((f) => f.id)));
        setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
        setSelectedNetworkIds(new Set(role.networks.map((n) => n.id)));
    }, [role, roleId]);

    // When the selected companies change, keep `selectedNetworkIds` only if the
    // network is still valid for the union of selected companies.
    useEffect(() => {
        if (!isSuperAdmin) return;

        if (isPrefillingRef.current) {
            isPrefillingRef.current = false;
            return;
        }

        const validNetworkIds = new Set(networkOptions.map((n) => n.id));
        setSelectedNetworkIds((prev) => {
            const next = new Set<number>();
            for (const id of prev) {
                if (validNetworkIds.has(id)) next.add(id);
            }
            return next;
        });
    }, [networkOptions, isSuperAdmin]);

    const toggleFeature = useCallback((id: number, checked: boolean) => {
        setSelectedFeatureIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const togglePermission = useCallback((id: number, checked: boolean) => {
        setSelectedPermissionIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const toggleCompany = useCallback((id: number, checked: boolean) => {
        setCompanyIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const toggleNetwork = useCallback((id: number, checked: boolean) => {
        setSelectedNetworkIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const toggleAllFeatures = useCallback(
        (ids: number[], checked: boolean) => {
            setSelectedFeatureIds((prev) => {
                const next = new Set(prev);
                for (const id of ids) {
                    if (checked) next.add(id);
                    else next.delete(id);
                }
                return next;
            });
        },
        [],
    );

    const toggleAllPermissions = useCallback(
        (ids: number[], checked: boolean) => {
            setSelectedPermissionIds((prev) => {
                const next = new Set(prev);
                for (const id of ids) {
                    if (checked) next.add(id);
                    else next.delete(id);
                }
                return next;
            });
        },
        [],
    );

    const { createRole: createRoleMutate } = useCreateRole();
    const { updateRole: updateRoleMutate } = useUpdateRole();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = useCallback(async (): Promise<void> => {
        if (isSubmitting) return;

        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error(ROLE_STRINGS.ERROR_SAVE);
            return;
        }

        if (isSuperAdmin && companyIds.size === 0) {
            toast.error(ROLE_STRINGS.SELECT_COMPANY_FIRST);
            return;
        }

        setIsSubmitting(true);
        try {
            const basePayload = {
                name: trimmedName,
                feature_ids: [...selectedFeatureIds],
                permission_ids: [...selectedPermissionIds],
                network_ids: [...selectedNetworkIds],
            };

            if (roleId != null) {
                // PUT /roles/{id} prohibits company_id; omit it even for superadmin.
                const updatePayload = {
                    ...basePayload,
                    ...(isSuperAdmin
                        ? {
                              is_system_role: isSystemRole,
                              company_ids: Array.from(companyIds),
                          }
                        : {}),
                };
                await updateRoleMutate(roleId, updatePayload);
            } else {
                // POST /roles: superadmin must send company_id + is_system_role.
                const createPayload = {
                    ...basePayload,
                    ...(isSuperAdmin
                        ? {
                              company_ids: Array.from(companyIds),
                              is_system_role: isSystemRole,
                          }
                        : {}),
                };
                await createRoleMutate(createPayload);
            }

            toast.success(ROLE_STRINGS.ROLE_SAVED);
            navigate("/roles");
        } catch {
            toast.error(ROLE_STRINGS.ERROR_SAVE);
        } finally {
            setIsSubmitting(false);
        }
    }, [
        isSubmitting,
        name,
        isSuperAdmin,
        roleId,
        companyIds,
        selectedFeatureIds,
        selectedPermissionIds,
        selectedNetworkIds,
        isSystemRole,
        createRoleMutate,
        updateRoleMutate,
        navigate,
    ]);

    return {
        role,
        isLoadingRole,

        name,
        setName,
        companyIds,
        toggleCompany,
        isSystemRole,
        setIsSystemRole,

        selectedFeatureIds,
        selectedPermissionIds,
        selectedNetworkIds,
        toggleFeature,
        togglePermission,
        toggleNetwork,
        toggleAllFeatures,
        toggleAllPermissions,

        featureGroups,
        isLoadingFeatures,
        permissionGroups,
        isLoadingPermissions,
        networkOptions,
        isLoadingNetworks: isSuperAdmin ? isLoadingNetworks : false,
        companyOptions,
        isLoadingCompanies,

        handleSubmit,
        isSubmitting,
    };
};

