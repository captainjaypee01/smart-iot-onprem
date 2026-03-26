// src/pages/roles/RoleFormPage.tsx
// Full-page Role create/edit UI with 4 tabs.

import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import { getFeatureLucideIcon } from "@/lib/featureLucideIcon";

import { ROLE_STRINGS, USER_STRINGS, UI_STRINGS } from "@/constants/strings";
import { useAuthStore } from "@/store/authStore";
import { useRoleForm } from "@/hooks/useRoleForm";
import type { FeatureGroup } from "@/types/feature";
import type { PermissionGroup } from "@/types/permission";

type RoleFormParams = {
    id?: string;
};

export default function RoleFormPage() {
    const navigate = useNavigate();
    const params = useParams<RoleFormParams>();
    const user = useAuthStore((s) => s.user);
    const isSuperAdmin = user?.is_superadmin ?? false;

    const parsedRoleId = useMemo(() => {
        if (!params.id) return undefined;
        const parsed = Number.parseInt(params.id, 10);
        if (Number.isNaN(parsed)) return undefined;
        return parsed;
    }, [params.id]);

    const {
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
        isLoadingNetworks,
        companyOptions,
        // isLoadingCompanies is not used; the checkbox list uses companyOptions length.

        handleSubmit,
        isSubmitting,
    } = useRoleForm({ roleId: parsedRoleId });

    const isEdit = parsedRoleId != null;

    const title = isEdit
        ? `${ROLE_STRINGS.EDIT_ROLE_PREFIX}${role?.name ?? ""}`.trimEnd()
        : ROLE_STRINGS.CREATE_ROLE;

    useEffect(() => {
        if (isEdit && !isLoadingRole && role == null) {
            toast.error(UI_STRINGS.ERROR_GENERIC);
        }
    }, [isEdit, isLoadingRole, role]);

    const tabBadgeFeatureCount = selectedFeatureIds.size;
    const tabBadgePermissionCount = selectedPermissionIds.size;
    const tabBadgeNetworkCount = selectedNetworkIds.size;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/roles")}
                        disabled={isSubmitting}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isEdit ? ROLE_STRINGS.SUBTITLE_EDIT : ROLE_STRINGS.SUBTITLE_CREATE}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => void handleSubmit()}
                    disabled={isSubmitting || isLoadingRole}
                >
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEdit ? ROLE_STRINGS.UPDATE_ROLE : ROLE_STRINGS.CREATE_ROLE}
                </Button>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList>
                    <TabsTrigger value="details">{ROLE_STRINGS.TAB_DETAILS}</TabsTrigger>
                    <TabsTrigger value="features" className="relative">
                        {ROLE_STRINGS.TAB_PAGE_ACCESS}
                        <Badge className="ml-2" variant="secondary">
                            {tabBadgeFeatureCount}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="relative">
                        {ROLE_STRINGS.TAB_PERMISSIONS}
                        <Badge className="ml-2" variant="secondary">
                            {tabBadgePermissionCount}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="networks" className="relative">
                        {ROLE_STRINGS.TAB_NETWORKS}
                        <Badge className="ml-2" variant="secondary">
                            {tabBadgeNetworkCount}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <Card className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>{ROLE_STRINGS.LABEL_ROLE_NAME}</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={ROLE_STRINGS.PLACEHOLDER_ROLE_NAME}
                                    disabled={isSubmitting || isLoadingRole}
                                />
                            </div>

                            <div className="space-y-2">
                                {isSuperAdmin ? (
                                    <div className="space-y-2">
                                        <Label>{USER_STRINGS.COMPANY}</Label>
                                        {companyOptions.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                {ROLE_STRINGS.SELECT_COMPANY_FIRST}
                                            </p>
                                        ) : (
                                            <div className="max-h-56 overflow-y-auto border rounded-md p-3 space-y-2">
                                                {companyOptions.map((c) => {
                                                    const checked = companyIds.has(c.id);
                                                    return (
                                                        <label
                                                            key={c.id}
                                                            className={cn(
                                                                "flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted transition-colors",
                                                                checked
                                                                    ? "border-primary bg-primary/5"
                                                                    : "border-border",
                                                            )}
                                                        >
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={(v) =>
                                                                    toggleCompany(
                                                                        c.id,
                                                                        v === true,
                                                                    )
                                                                }
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium truncate">
                                                                    {c.name}
                                                                </p>
                                                                <code className="text-xs text-muted-foreground font-mono">
                                                                    {c.code}
                                                                </code>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <Label>{USER_STRINGS.COMPANY}</Label>
                                        <p className="text-sm font-medium mt-1">
                                            {user?.company?.name ?? USER_STRINGS.NO_COMPANY}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {isSuperAdmin && (
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={isSystemRole}
                                    onCheckedChange={(v) =>
                                        setIsSystemRole(v === true)
                                    }
                                />
                                <div>
                                    <Label>{ROLE_STRINGS.LABEL_IS_SYSTEM_ROLE}</Label>
                                    <p className="text-xs text-muted-foreground">
                                        {ROLE_STRINGS.SYSTEM_ROLE_HELPER}
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="features">
                    {isLoadingFeatures ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {featureGroups.map((group: FeatureGroup) => {
                                const checkedCount = group.features.filter((f) =>
                                    selectedFeatureIds.has(f.id),
                                ).length;
                                const allChecked =
                                    group.features.length > 0 &&
                                    checkedCount === group.features.length;

                                return (
                                    <Card key={group.group} className="p-6 mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold">
                                                    {group.label}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {checkedCount}/{group.features.length}{" "}
                                                    {ROLE_STRINGS.SELECTED}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    toggleAllFeatures(
                                                        group.features.map((f) => f.id),
                                                        !allChecked,
                                                    )
                                                }
                                            >
                                                {allChecked
                                                    ? ROLE_STRINGS.DESELECT_ALL
                                                    : ROLE_STRINGS.SELECT_ALL}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {group.features.map((f) => {
                                                const checked = selectedFeatureIds.has(f.id);
                                                const Icon = getFeatureLucideIcon(
                                                    f.icon,
                                                );

                                                return (
                                                    <label
                                                        key={f.id}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors",
                                                            checked
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border",
                                                        )}
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
                                                        <span className="text-sm font-medium">
                                                            {f.name}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="permissions">
                    {isLoadingPermissions ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {permissionGroups.map((group: PermissionGroup) => {
                                const ids = group.permissions.map((p) => p.id);
                                const checkedCount = group.permissions.filter((p) =>
                                    selectedPermissionIds.has(p.id),
                                ).length;
                                const allChecked =
                                    ids.length > 0 &&
                                    checkedCount === ids.length;

                                return (
                                    <Card key={group.module} className="p-6 mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold">
                                                    {group.label}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {checkedCount}/{ids.length}{" "}
                                                    {ROLE_STRINGS.SELECTED}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    toggleAllPermissions(
                                                        ids,
                                                        !allChecked,
                                                    )
                                                }
                                            >
                                                {allChecked
                                                    ? ROLE_STRINGS.DESELECT_ALL
                                                    : ROLE_STRINGS.SELECT_ALL}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {group.permissions.map((p) => {
                                                const checked =
                                                    selectedPermissionIds.has(p.id);

                                                return (
                                                    <label
                                                        key={p.id}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors",
                                                            checked
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border",
                                                        )}
                                                    >
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={(c) =>
                                                                togglePermission(
                                                                    p.id,
                                                                    c === true,
                                                                )
                                                            }
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium">
                                                                {p.display_name}
                                                            </p>
                                                            <code className="text-xs text-muted-foreground font-mono">
                                                                {p.key}
                                                            </code>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="networks">
                    {isLoadingNetworks ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : companyIds.size === 0 ? (
                        <Card className="p-6">
                            <p className="text-sm text-muted-foreground">
                                {ROLE_STRINGS.SELECT_COMPANY_FIRST}
                            </p>
                        </Card>
                    ) : networkOptions.length === 0 ? (
                        <Card className="p-6">
                            <p className="text-sm text-muted-foreground">
                                {ROLE_STRINGS.EMPTY_NETWORKS}
                            </p>
                        </Card>
                    ) : (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">
                                    {ROLE_STRINGS.SECTION_NETWORK_ACCESS}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {selectedNetworkIds.size} {ROLE_STRINGS.OF}{" "}
                                    {networkOptions.length} {ROLE_STRINGS.SELECTED}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {networkOptions.map((n) => {
                                    const checked =
                                        selectedNetworkIds.has(n.id);

                                    return (
                                        <label
                                            key={n.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors",
                                                checked
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border",
                                            )}
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={(c) =>
                                                    toggleNetwork(
                                                        n.id,
                                                        c === true,
                                                    )
                                                }
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {n.name}
                                                </p>
                                                <code className="text-xs text-muted-foreground font-mono">
                                                    {n.network_address}
                                                </code>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

