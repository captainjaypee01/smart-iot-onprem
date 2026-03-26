// src/components/shared/RoleFormDialog.tsx
// Role create/edit dialog: assigns page access (features), action permissions, and network access.

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import type { ComponentType, FormEvent } from "react";
import { toast } from "sonner";

import type { NetworkOption } from "@/types/network";
import type { Role } from "@/types/role";
import type { CompanyOption } from "@/types/company";
import type { NetworkSummary } from "@/types/auth";

import { useAuthStore } from "@/store/authStore";

import { ROLE_STRINGS, UI_STRINGS, USER_STRINGS } from "@/constants/strings";

import { useRoleFeaturesOptions } from "@/hooks/useRoleFeaturesOptions";
import { useRolePermissionsGrouped } from "@/hooks/useRolePermissionsGrouped";
import { useRoleNetworksOptions } from "@/hooks/useRoleNetworksOptions";
import { useCreateRole, useUpdateRole } from "@/hooks/useRoleMutations";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export interface RoleFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role?: Role;
    onSuccess: () => void;
    companyOptions: CompanyOption[]; // lifted from RolesPage to avoid duplicate requests
    companiesLoading: boolean;
}

type LucideIconComponent = ComponentType<{ className?: string }>;

function getLucideIcon(iconName: string | null): LucideIconComponent {
    if (iconName && iconName in Icons) {
        return Icons[iconName as keyof typeof Icons] as unknown as LucideIconComponent;
    }
    return Icons.Circle as unknown as LucideIconComponent;
}

const RoleFormDialog = ({
    open,
    onOpenChange,
    role,
    onSuccess,
    companyOptions,
    companiesLoading,
}: RoleFormDialogProps) => {
    const user = useAuthStore((s) => s.user);
    const isSuperAdmin = user?.is_superadmin ?? false;

    const prefillCompanyId = role?.company?.id ?? null;
    const defaultCompanyId = useMemo(() => {
        if (!isSuperAdmin) return user?.company?.id ?? null;
        return prefillCompanyId ?? companyOptions[0]?.id ?? user?.company?.id ?? null;
    }, [isSuperAdmin, prefillCompanyId, companyOptions, user?.company?.id]);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { createRole: createRoleMutate } = useCreateRole();
    const { updateRole: updateRoleMutate } = useUpdateRole();

    const [name, setName] = useState<string>("");
    const [isSystemRole, setIsSystemRole] = useState<boolean>(false);
    const [companyId, setCompanyId] = useState<number | null>(null);

    const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<number>>(new Set());
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
    const [selectedNetworkIds, setSelectedNetworkIds] = useState<Set<number>>(new Set());

    const {
        groups: featureGroups,
        isLoading: isFeaturesLoading,
    } = useRoleFeaturesOptions(open);

    const {
        groups: permissionGroups,
        isLoading: isPermissionsLoading,
    } = useRolePermissionsGrouped(open);

    const {
        options: superadminNetworkOptions,
        isLoading: isSuperadminNetworksLoading,
    } = useRoleNetworksOptions(
        isSuperAdmin && open && companyId != null,
        companyId != null ? [companyId] : [],
    );

    const activeUserNetworks: NetworkOption[] = useMemo(() => {
        const networks = (user?.networks ?? []) as NetworkSummary[];
        return networks.map((n) => ({
            id: n.id,
            name: n.name,
            network_address: n.network_address,
            is_active: true,
        }));
    }, [user?.networks]);

    const networkOptions: NetworkOption[] = isSuperAdmin
        ? superadminNetworkOptions
        : activeUserNetworks;

    const isNetworksLoading: boolean = isSuperAdmin
        ? isSuperadminNetworksLoading
        : false;

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

    const toggleAllFeaturesInGroup = useCallback((featureIds: number[], checked: boolean) => {
        setSelectedFeatureIds((prev) => {
            const next = new Set(prev);
            for (const id of featureIds) {
                if (checked) next.add(id);
                else next.delete(id);
            }
            return next;
        });
    }, []);

    const toggleAllPermissionsInModule = useCallback(
        (permissionIds: number[], checked: boolean) => {
            setSelectedPermissionIds((prev) => {
                const next = new Set(prev);
                for (const id of permissionIds) {
                    if (checked) next.add(id);
                    else next.delete(id);
                }
                return next;
            });
        },
        [],
    );

    // ─── Prefill on open (create vs edit) ────────────────────────────
    useEffect(() => {
        if (!open) return;

        const roleFeatures = role?.features ?? [];
        const rolePermissions = role?.permissions ?? [];
        const roleNetworks = role?.networks ?? [];

        setName(role?.name ?? "");
        setIsSystemRole(role?.is_system_role ?? false);
        setCompanyId(prefillCompanyId ?? defaultCompanyId);

        setSelectedFeatureIds(new Set(roleFeatures.map((f) => f.id)));
        setSelectedPermissionIds(new Set(rolePermissions.map((p) => p.id)));
        setSelectedNetworkIds(new Set(roleNetworks.map((n) => n.id)));
    }, [open, role, prefillCompanyId, defaultCompanyId]);

    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            if (isSubmitting) return;

            const trimmedName = name.trim();
            if (!trimmedName) {
                toast.error(ROLE_STRINGS.ERROR_SAVE);
                return;
            }

            if (!role && isSuperAdmin && companyId == null) {
                toast.error(ROLE_STRINGS.ERROR_SAVE);
                return;
            }

            setIsSubmitting(true);
            try {
                const payload = {
                    name: trimmedName,
                    feature_ids: [...selectedFeatureIds],
                    permission_ids: [...selectedPermissionIds],
                    network_ids: [...selectedNetworkIds],
                };

                const superadminExtras =
                    isSuperAdmin
                        ? {
                              is_system_role: isSystemRole,
                          }
                        : {};

                if (role) {
                    // PUT /roles/{id} prohibits company_id; role company is immutable.
                    const updatePayload = { ...payload, ...superadminExtras };
                    await updateRoleMutate(role.id, updatePayload);
                } else {
                    // POST /roles requires company_id for superadmin.
                    const createPayload = {
                        ...payload,
                        ...superadminExtras,
                        company_id: companyId as number,
                    };
                    await createRoleMutate(createPayload);
                }

                toast.success(ROLE_STRINGS.ROLE_SAVED);
                onSuccess();
                onOpenChange(false);
            } catch {
                toast.error(ROLE_STRINGS.ERROR_SAVE);
            } finally {
                setIsSubmitting(false);
            }
        },
        [
            isSubmitting,
            name,
            isSuperAdmin,
            companyId,
            selectedFeatureIds,
            selectedPermissionIds,
            selectedNetworkIds,
            isSystemRole,
            role,
            onSuccess,
            onOpenChange,
            createRoleMutate,
            updateRoleMutate,
        ],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <form onSubmit={handleSubmit}>
                <DialogContent className="w-full max-w-3xl max-h-[90vh] flex flex-col gap-0">
                    <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                        <DialogTitle>
                            {role
                                ? ROLE_STRINGS.DIALOG_TITLE_EDIT
                                : ROLE_STRINGS.DIALOG_TITLE_CREATE}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-6">
                        {/* SECTION 1 — Identity */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role-name">{ROLE_STRINGS.LABEL_NAME}</Label>
                                    <Input
                                        id="role-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-background dark:bg-background"
                                    />
                                </div>

                                {isSuperAdmin && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-4 pt-2">
                                            <Label htmlFor="role-is-system">
                                                {ROLE_STRINGS.LABEL_IS_SYSTEM_ROLE}
                                            </Label>
                                            <Switch
                                                id="role-is-system"
                                                checked={isSystemRole}
                                                onCheckedChange={(checked) =>
                                                    setIsSystemRole(checked)
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {isSuperAdmin ? (
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>{USER_STRINGS.COMPANY}</Label>
                                        <Select
                                            value={companyId != null ? String(companyId) : undefined}
                                            onValueChange={(v) => {
                                                const parsed = parseInt(v, 10);
                                                if (Number.isNaN(parsed)) return;
                                                setCompanyId(parsed);
                                                setSelectedNetworkIds(new Set());
                                            }}
                                            disabled={companiesLoading || role != null}
                                        >
                                            <SelectTrigger className="bg-background dark:bg-background">
                                                <SelectValue
                                                    placeholder={
                                                        companyId == null
                                                            ? USER_STRINGS.NO_COMPANY
                                                            : undefined
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companyOptions.map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={String(c.id)}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>{USER_STRINGS.COMPANY}</Label>
                                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                                            {user?.company?.name ?? USER_STRINGS.NO_COMPANY}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION 2 — Page Access (Features) */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-foreground">
                                {ROLE_STRINGS.SECTION_PAGE_ACCESS}
                            </h3>

                            <div className="max-h-56 overflow-y-auto border rounded-md p-3 space-y-4">
                                {isFeaturesLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                ) : (
                                    featureGroups.map((g) => {
                                        const featureIds = g.features.map((f) => f.id);
                                        const allSelected =
                                            featureIds.length > 0 &&
                                            featureIds.every((id) => selectedFeatureIds.has(id));

                                        return (
                                            <div key={g.group} className="space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-sm font-medium">
                                                        {g.label}
                                                    </span>

                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            {ROLE_STRINGS.SELECT_ALL}
                                                        </span>
                                                        <Switch
                                                            checked={allSelected}
                                                            onCheckedChange={(checked) =>
                                                                toggleAllFeaturesInGroup(
                                                                    featureIds,
                                                                    checked,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                    {g.features.map((f) => {
                                                        const Icon = getLucideIcon(f.icon);
                                                        const checked = selectedFeatureIds.has(f.id);

                                                        return (
                                                            <label
                                                                key={f.id}
                                                                className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted"
                                                            >
                                                                <Checkbox
                                                                    checked={checked}
                                                                    onCheckedChange={(c) =>
                                                                        toggleFeature(
                                                                            f.id,
                                                                            c === true,
                                                                        )
                                                                    }
                                                                />
                                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm">
                                                                    {f.name}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* SECTION 3 — Action Permissions (Modules/Permissions) */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-foreground">
                                {ROLE_STRINGS.SECTION_ACTION_PERMISSIONS}
                            </h3>

                            <div className="max-h-56 overflow-y-auto border rounded-md p-3 space-y-4">
                                {isPermissionsLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                ) : (
                                    permissionGroups.map((pg) => {
                                        const permissionIds = pg.permissions.map(
                                            (p) => p.id,
                                        );
                                        const allSelected =
                                            permissionIds.length > 0 &&
                                            permissionIds.every((id) =>
                                                selectedPermissionIds.has(id),
                                            );

                                        return (
                                            <div key={pg.module} className="space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-sm font-medium">
                                                        {pg.label}
                                                    </span>

                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            {ROLE_STRINGS.SELECT_ALL}
                                                        </span>
                                                        <Switch
                                                            checked={allSelected}
                                                            onCheckedChange={(checked) =>
                                                                toggleAllPermissionsInModule(
                                                                    permissionIds,
                                                                    checked,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                    {pg.permissions.map((p) => (
                                                        <label
                                                            key={p.id}
                                                            className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted"
                                                        >
                                                            <Checkbox
                                                                checked={selectedPermissionIds.has(
                                                                    p.id,
                                                                )}
                                                                onCheckedChange={(c) =>
                                                                    togglePermission(
                                                                        p.id,
                                                                        c === true,
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-sm">
                                                                {p.display_name}
                                                            </span>
                                                            <code className="text-xs text-muted-foreground font-mono ml-auto">
                                                                {p.key}
                                                            </code>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* SECTION 4 — Network Access */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-foreground">
                                {ROLE_STRINGS.SECTION_NETWORK_ACCESS}
                            </h3>

                            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                                {isNetworksLoading ? (
                                    <div className="space-y-2 p-2">
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-5/6" />
                                        <Skeleton className="h-8 w-2/3" />
                                    </div>
                                ) : networkOptions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground dark:text-muted-foreground p-2">
                                        {ROLE_STRINGS.EMPTY_NETWORKS}
                                    </p>
                                ) : (
                                    networkOptions.map((n) => (
                                        <label
                                            key={n.id}
                                            className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted"
                                        >
                                            <Checkbox
                                                checked={selectedNetworkIds.has(n.id)}
                                                onCheckedChange={(c) =>
                                                    toggleNetwork(
                                                        n.id,
                                                        c === true,
                                                    )
                                                }
                                            />
                                            <span className="text-sm">{n.name}</span>
                                            <code className="font-mono text-xs text-muted-foreground ml-auto">
                                                {n.network_address}
                                            </code>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 shrink-0 border-t">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onOpenChange(false)}
                        >
                            {UI_STRINGS.CANCEL}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && (
                                <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {role ? ROLE_STRINGS.UPDATE_ROLE : ROLE_STRINGS.CREATE_ROLE}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    );
};

export default RoleFormDialog;

