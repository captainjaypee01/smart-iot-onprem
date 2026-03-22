// src/pages/roles/RolesPage.tsx
// Roles list page (table + filters). Role create/edit/delete flows use RoleFormDialog and API hooks.

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTableServer, type DataTableColumn } from "@/components/shared/DataTableServer";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { useCompanyOptions } from "@/hooks/useCompanies";
import { useRole } from "@/hooks/useRole";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useRoles, type RolesQueryParams } from "@/hooks/useRoles";
import { useDeleteRole } from "@/hooks/useRoleMutations";
import type { Role } from "@/types/role";
import type { CompanyOption } from "@/types/company";
import { ROLE_STRINGS, UI_STRINGS, USER_STRINGS } from "@/constants/strings";

const DEFAULT_PER_PAGE = 15;
const SEARCH_DEBOUNCE_MS = 400;

export default function RolesPage() {
    const navigate = useNavigate();
    const { isSuperAdmin } = useRole();
    const superAdmin = isSuperAdmin();

    const { canViewRoles, canCreateRole, canUpdateRole, canDeleteRole } = useRolePermissions();

    const canView = canViewRoles();
    const canCreate = canCreateRole();
    const canUpdate = canUpdateRole();
    const canDelete = canDeleteRole();

    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);

    const [searchInput, setSearchInput] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    const [companyFilterId, setCompanyFilterId] = useState<number | null>(null);

    const { options: companyOptions } = useCompanyOptions();

    const { deleteRole: deleteRoleMutate } = useDeleteRole();

    const rolesParams: RolesQueryParams = useMemo(() => {
        return {
            page,
            per_page: perPage,
            search: debouncedSearch || undefined,
            company_id: superAdmin && companyFilterId != null ? companyFilterId : undefined,
        };
    }, [page, perPage, debouncedSearch, superAdmin, companyFilterId]);

    const {
        roles,
        meta,
        isLoading,
        refetch,
    } = useRoles(rolesParams);

    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [pendingDelete, setPendingDelete] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const confirmDelete = (role: Role) => {
        if (role.is_system_role) return;
        if (role.users_count > 0) {
            toast.warning(ROLE_STRINGS.DELETE_409_TOOLTIP);
            return;
        }
        setPendingDelete(role);
        setConfirmOpen(true);
    };

    const handleActualDelete = async () => {
        if (!pendingDelete) return;
        setIsDeleting(true);
        try {
            await deleteRoleMutate(pendingDelete.id);
            toast.success(ROLE_STRINGS.ROLE_DELETED);
            setConfirmOpen(false);
            setPendingDelete(null);
            void refetch();
        } catch (errorUnknown: unknown) {
            if (errorUnknown instanceof Error && /409/.test(errorUnknown.message)) {
                toast.warning(ROLE_STRINGS.DELETE_409_TOOLTIP);
            } else {
                toast.error(ROLE_STRINGS.ERROR_DELETE);
            }
            setConfirmOpen(false);
            setPendingDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const t = window.setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [companyFilterId]);

    const columns: DataTableColumn<Role>[] = useMemo(() => {
        const base: DataTableColumn<Role>[] = [
            {
                id: "name",
                header: ROLE_STRINGS.COL_NAME,
                cell: (row) => row.name,
            },
            {
                id: "features_count",
                header: ROLE_STRINGS.COL_FEATURES,
                cell: (row) => (
                    <Badge variant="secondary" className="font-mono text-xs">
                        {row.features_count}
                    </Badge>
                ),
            },
            {
                id: "permissions_count",
                header: ROLE_STRINGS.COL_PERMISSIONS,
                cell: (row) => (
                    <Badge variant="secondary" className="font-mono text-xs">
                        {row.permissions_count}
                    </Badge>
                ),
            },
            {
                id: "networks_count",
                header: ROLE_STRINGS.COL_NETWORKS,
                cell: (row) => (
                    <Badge variant="secondary" className="font-mono text-xs">
                        {row.networks_count}
                    </Badge>
                ),
            },
            {
                id: "users_count",
                header: ROLE_STRINGS.COL_USERS,
                cell: (row) => (
                    <Badge variant="secondary" className="font-mono text-xs">
                        {row.users_count}
                    </Badge>
                ),
            },
            {
                id: "system",
                header: ROLE_STRINGS.COL_SYSTEM,
                cell: (row) =>
                    row.is_system_role ? (
                        <Badge variant="destructive">{ROLE_STRINGS.SYSTEM_ROLE}</Badge>
                    ) : (
                        <span className="text-muted-foreground">{UI_STRINGS.N_A}</span>
                    ),
            },
        ];

        if (superAdmin) {
            base.splice(1, 0, {
                id: "company",
                header: ROLE_STRINGS.COL_COMPANY,
                cell: (row) => row.company?.name ?? USER_STRINGS.NO_COMPANY,
            });
        }

        base.push({
            id: "actions",
            header: ROLE_STRINGS.COL_ACTIONS,
            className: "w-[140px]",
            cell: (row) => {
                if (!row.is_system_role) {
                    const deleteDisabled = row.users_count > 0;
                    return (
                        <div className="flex gap-2">
                            {canUpdate && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/roles/${row.id}/edit`)}
                                >
                                    <Pencil className="mr-1 h-4 w-4" />
                                    {UI_STRINGS.EDIT}
                                </Button>
                            )}

                            {canDelete && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={deleteDisabled}
                                                onClick={() => confirmDelete(row)}
                                            >
                                                <Trash2 className="mr-1 h-4 w-4" />
                                                {UI_STRINGS.DELETE}
                                            </Button>
                                        </TooltipTrigger>
                                        {deleteDisabled && (
                                            <TooltipContent>
                                                {ROLE_STRINGS.DELETE_409_TOOLTIP}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    );
                }

                return null;
            },
        });

        return base;
    }, [superAdmin, canUpdate, canDelete, navigate]);

    if (!canView) return <Navigate to="/403" replace />;

    // Role delete confirm dialog — wired to API once RoleFormDialog is implemented.
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">{ROLE_STRINGS.TITLE}</h1>
                    </div>

                    {canCreate && (
                        <Button onClick={() => navigate("/roles/create")}>
                            <Plus className="mr-1 h-4 w-4" />
                            {ROLE_STRINGS.CREATE_ROLE}
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="role-search">{UI_STRINGS.SEARCH}</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="role-search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={ROLE_STRINGS.SEARCH_PLACEHOLDER}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {superAdmin && (
                        <div className="flex flex-col gap-2">
                            <Label>{USER_STRINGS.COMPANY}</Label>
                            <Select
                                value={companyFilterId != null ? String(companyFilterId) : undefined}
                                onValueChange={(v) => {
                                    const parsed = parseInt(v, 10);
                                    setCompanyFilterId(Number.isNaN(parsed) ? null : parsed);
                                }}
                            >
                                <SelectTrigger className="bg-background dark:bg-background">
                                    <SelectValue placeholder={UI_STRINGS.ALL} />
                                </SelectTrigger>
                                <SelectContent>
                                    {companyOptions.map((c: CompanyOption) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <DataTableServer
                    columns={columns}
                    data={roles}
                    isLoading={isLoading}
                    emptyMessage={UI_STRINGS.NO_RESULTS}
                    meta={meta}
                    page={page}
                    onPageChange={setPage}
                    perPage={perPage}
                    onPerPageChange={(nextPerPage) => {
                        setPerPage(nextPerPage);
                        setPage(1);
                    }}
                />
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{ROLE_STRINGS.CONFIRM_DELETE_TITLE}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete ? pendingDelete.name : UI_STRINGS.UNKNOWN}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            {UI_STRINGS.CANCEL}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => void handleActualDelete()}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {UI_STRINGS.LOADING}
                                </span>
                            ) : (
                                UI_STRINGS.DELETE
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

