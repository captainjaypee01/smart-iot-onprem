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
    companyId: number | null;
    setCompanyId: (v: number | null) => void;
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
    const [companyId, setCompanyId] = useState<number | null>(userCompanyId);
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

    // Networks options:
    // - superadmin can fetch /v1/networks/options scoped by company_id
    // - company admin falls back to networks available in /auth/me (role_networks)
    const shouldFetchSuperadminNetworks = isSuperAdmin && companyId != null;
    const {
        options: apiNetworkOptions,
        isLoading: isLoadingNetworks,
    } = useRoleNetworksOptions(shouldFetchSuperadminNetworks, companyId);

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

    // Keep companyId aligned for company admins (who can't change it).
    useEffect(() => {
        if (roleId != null) return;
        if (companyId != null) return;
        if (userCompanyId == null) return;
        setCompanyId(userCompanyId);
    }, [companyId, roleId, userCompanyId]);

    // Prefill on edit.
    useEffect(() => {
        if (roleId == null) return;
        if (!role) return;

        isPrefillingRef.current = true;
        setName(role.name);
        setCompanyId(role.company.id);
        setIsSystemRole(role.is_system_role);

        setSelectedFeatureIds(new Set(role.features.map((f) => f.id)));
        setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
        setSelectedNetworkIds(new Set(role.networks.map((n) => n.id)));
    }, [role, roleId]);

    // Clear selected networks on company change (superadmin only).
    useEffect(() => {
        if (!isSuperAdmin) return;

        if (isPrefillingRef.current) {
            isPrefillingRef.current = false;
            return;
        }

        setSelectedNetworkIds(new Set());
    }, [companyId, isSuperAdmin]);

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

        if (isSuperAdmin && roleId == null && companyId == null) {
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
                    ...(isSuperAdmin ? { is_system_role: isSystemRole } : {}),
                };
                await updateRoleMutate(roleId, updatePayload);
            } else {
                // POST /roles: superadmin must send company_id + is_system_role.
                const createPayload = {
                    ...basePayload,
                    ...(isSuperAdmin
                        ? {
                              company_id: companyId as number,
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
        companyId,
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
        companyId,
        setCompanyId,
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

