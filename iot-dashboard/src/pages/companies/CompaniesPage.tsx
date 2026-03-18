// src/pages/companies/CompaniesPage.tsx
// Companies listing page — filters, paginated table, and CRUD actions.

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { useCompanies, useDeleteCompany, useUploadCompanyLogo } from "@/hooks/useCompanies";
import { useCompanyPermissions } from "@/hooks/useCompanyPermissions";
import type { Company } from "@/types/company";
import CompanyFormDialog from "@/components/shared/CompanyFormDialog";
import { Loader2, Edit3, Trash2, Upload, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY_STRINGS, UI_STRINGS } from "@/constants/strings";
import { useRole } from "@/hooks/useRole";

export default function CompaniesPage() {
    const { isSuperAdmin } = useRole();
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(15);
    const [search, setSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
        undefined,
    );
    const [isDemoFilter, setIsDemoFilter] = useState<boolean | undefined>(
        undefined,
    );

    const { canViewCompanies, canCreateCompany, canUpdateCompany, canDeleteCompany, canUploadCompanyLogo } =
        useCompanyPermissions();

    const { companies, meta, isLoading, error, refetch } = useCompanies({
        page,
        perPage,
        search: debouncedSearch,
        isActive: isActiveFilter,
        isDemo: isDemoFilter,
    });

    const { deleteCompany } = useDeleteCompany();
    const { uploadCompanyLogo, isUploading } = useUploadCompanyLogo();

    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(
        undefined,
    );

    const openCreateDialog = () => {
        setSelectedCompany(undefined);
        setDialogOpen(true);
    };

    const openEditDialog = (company: Company) => {
        setSelectedCompany(company);
        setDialogOpen(true);
    };

    const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const confirmDelete = (company: Company) => {
        if (company.users_count > 0) {
            toast.warning(COMPANY_STRINGS.DELETE_409_TOOLTIP);
            return;
        }
        setDeleteTarget(company);
    };

    const handleActualDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteCompany(deleteTarget.id);
            toast.success(COMPANY_STRINGS.COMPANY_DELETED);
            setDeleteTarget(null);
            await refetch();
        } catch {
            toast.error(COMPANY_STRINGS.ERROR_DELETE);
        } finally {
            setIsDeleting(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadTarget, setUploadTarget] = useState<Company | null>(null);

    const openUpload = (company: Company) => {
        setUploadTarget(company);
        fileInputRef.current?.click();
    };

    const handleLogoFileChange = async (file: File | null) => {
        if (!uploadTarget || !file) return;
        try {
            const updated = await uploadCompanyLogo(uploadTarget.id, file);
            setUploadTarget(null);
            await refetch();
            toast.success(COMPANY_STRINGS.TOAST_LOGO_SUCCESS);
            // Keep preview in sync by letting refetch update the list row.
            void updated;
        } catch {
            toast.error(COMPANY_STRINGS.TOAST_LOGO_ERROR);
        }
    };

    useEffect(() => {
        const t = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 400);
        return () => window.clearTimeout(t);
    }, [search]);

    const columns: DataTableColumn<Company>[] = useMemo(() => {
        return [
            {
                id: "code",
                header: COMPANY_STRINGS.COL_CODE,
                className: "w-28",
                cell: (row) => (
                    <Badge
                        variant="secondary"
                        className="font-mono text-xs bg-muted px-2 py-1 dark:bg-muted"
                    >
                        {row.code}
                    </Badge>
                ),
            },
            {
                id: "name",
                header: COMPANY_STRINGS.COL_NAME,
                cell: (row) => row.name,
            },
            {
                id: "timezone",
                header: COMPANY_STRINGS.COL_TIMEZONE,
                cell: (row) => row.timezone,
            },
            {
                id: "networks",
                header: COMPANY_STRINGS.COL_NETWORKS,
                cell: (row) => (
                    <Badge variant="secondary" className="text-xs">
                        {COMPANY_STRINGS.NETWORKS_COUNT_LABEL(row.networks_count)}
                    </Badge>
                ),
            },
            {
                id: "users",
                header: COMPANY_STRINGS.COL_USERS,
                cell: (row) => (
                    <Badge variant="secondary" className="text-xs">
                        {COMPANY_STRINGS.USERS_COUNT_LABEL(row.users_count)}
                    </Badge>
                ),
            },
            {
                id: "active",
                header: COMPANY_STRINGS.COL_ACTIVE,
                cell: (row) => (
                    <Badge
                        className={cn(
                            "text-xs",
                            row.is_active
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
                                : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
                        )}
                    >
                        {row.is_active
                            ? COMPANY_STRINGS.BADGE_ACTIVE
                            : COMPANY_STRINGS.BADGE_INACTIVE}
                    </Badge>
                ),
            },
            {
                id: "demo",
                header: COMPANY_STRINGS.COL_DEMO,
                cell: (row) =>
                    row.is_demo ? (
                        <Badge
                            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs"
                            variant="secondary"
                        >
                            {COMPANY_STRINGS.BADGE_DEMO}
                        </Badge>
                    ) : (
                        <span />
                    ),
            },
            {
                id: "actions",
                header: COMPANY_STRINGS.COL_ACTIONS,
                cell: (row) => (
                    <div className="flex items-center justify-end gap-2">
                        {canUpdateCompany() && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditDialog(row)}
                                aria-label={UI_STRINGS.EDIT}
                            >
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        )}
                        {canUploadCompanyLogo() && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openUpload(row)}
                                aria-label={COMPANY_STRINGS.UPLOAD_LOGO}
                                disabled={isUploading}
                            >
                                <Upload className="h-4 w-4" />
                            </Button>
                        )}
                        {canDeleteCompany() && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => confirmDelete(row)}
                                aria-label={UI_STRINGS.DELETE}
                                disabled={row.users_count > 0 || isDeleting}
                                title={
                                    row.users_count > 0
                                        ? COMPANY_STRINGS.DELETE_409_TOOLTIP
                                        : undefined
                                }
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                ),
            },
        ];
    }, [
        canDeleteCompany,
        canUpdateCompany,
        canUploadCompanyLogo,
        confirmDelete,
        isDeleting,
        isUploading,
        openEditDialog,
    ]);

    if (!isSuperAdmin()) return null;
    if (!canViewCompanies()) return null;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {COMPANY_STRINGS.TITLE}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {COMPANY_STRINGS.SUBTITLE}
                    </p>
                </div>
                {canCreateCompany() && (
                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {COMPANY_STRINGS.CREATE_COMPANY}
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-0">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder={COMPANY_STRINGS.SEARCH_PLACEHOLDER}
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                        }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {COMPANY_STRINGS.FILTER_ACTIVE_LABEL}
                    </span>
                    <Switch
                        checked={isActiveFilter ?? false}
                        onCheckedChange={(checked: boolean) => {
                            setIsActiveFilter(checked);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {COMPANY_STRINGS.FILTER_DEMO_LABEL}
                    </span>
                    <Switch
                        checked={isDemoFilter ?? false}
                        onCheckedChange={(checked: boolean) => {
                            setIsDemoFilter(checked);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <DataTableServer<Company>
                    columns={columns}
                    data={error || isLoading ? [] : companies}
                    isLoading={isLoading}
                    emptyMessage={
                        error ? UI_STRINGS.ERROR_GENERIC : COMPANY_STRINGS.NO_COMPANIES
                    }
                    meta={meta}
                    page={page}
                    onPageChange={setPage}
                    perPage={perPage}
                    onPerPageChange={setPerPage}
                />
            </div>

            {dialogOpen && (
                <CompanyFormDialog
                    open={dialogOpen}
                    onOpenChange={(nextOpen) => setDialogOpen(nextOpen)}
                    company={selectedCompany ?? undefined}
                    onSuccess={() => {
                        void refetch();
                    }}
                />
            )}

            <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    void handleLogoFileChange(file);
                }}
                disabled={isUploading}
            />

            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open: boolean) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{UI_STRINGS.DELETE}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {COMPANY_STRINGS.CONFIRM_DELETE}
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
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            {UI_STRINGS.DELETE}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

