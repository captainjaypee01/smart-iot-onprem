// src/pages/permissions/PermissionsPage.tsx
// Permissions CRUD table using DataTableServer – superadmin tooling for managing permission definitions.

import React, { useEffect, useMemo, useState } from "react";
import { DataTableServer } from "@/components/shared/DataTableServer";
import type { DataTableColumn, DataTableMeta } from "@/components/shared/DataTableServer";
import { getPermissionsPaginated, createPermission, updatePermission, deletePermission } from "@/api/permissions";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Permission } from "@/types/permission";

const PermissionsPage = () => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [data, setData] = useState<Permission[]>([]);
    const [meta, setMeta] = useState<DataTableMeta | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);

    const { hasPermission } = usePermission();
    const canCreate = hasPermission("permission.create");
    const canUpdate = hasPermission("permission.update");
    const canDelete = hasPermission("permission.delete");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [activePermission, setActivePermission] = useState<Permission | null>(null);

    const [formKey, setFormKey] = useState("");
    const [formDisplayName, setFormDisplayName] = useState("");
    const [formModule, setFormModule] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setFormKey("");
        setFormDisplayName("");
        setFormModule("");
        setFormDescription("");
    };

    const openCreate = () => {
        resetForm();
        setActivePermission(null);
        setIsCreateOpen(true);
    };

    const openEdit = (permission: Permission) => {
        setActivePermission(permission);
        setFormKey(permission.key);
        setFormDisplayName(permission.display_name);
        setFormModule(permission.module);
        setFormDescription(permission.description ?? "");
        setIsEditOpen(true);
    };

    const openDelete = (permission: Permission) => {
        setActivePermission(permission);
        setIsDeleteOpen(true);
    };

    const columns: DataTableColumn<Permission>[] = useMemo(() => {
        const base: DataTableColumn<Permission>[] = [
            {
                id: "key",
                header: "Key",
                cell: (row) => row.key,
            },
            {
                id: "display_name",
                header: "Display Name",
                cell: (row) => row.display_name,
            },
            {
                id: "module",
                header: "Module",
                cell: (row) => row.module,
            },
            {
                id: "description",
                header: "Description",
                cell: (row) => row.description ?? "—",
            },
        ];

        if (canUpdate || canDelete) {
            base.push({
                id: "actions",
                header: "Actions",
                className: "w-[140px]",
                cell: (row) => (
                    <div className="flex gap-2">
                        {canUpdate && (
                            <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                                Edit
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDelete(row)}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                ),
            });
        }

        return base;
    }, [canUpdate, canDelete]);

    useEffect(() => {
        const fetchPage = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await getPermissionsPaginated({
                    page,
                    per_page: perPage,
                });
                setData(res.data);
                if (res.meta) {
                    setMeta({
                        current_page: res.meta.current_page,
                        last_page: res.meta.last_page,
                        per_page: res.meta.per_page,
                        total: res.meta.total,
                    });
                } else {
                    setMeta(null);
                }
            } catch {
                setError("Failed to load permissions.");
                setData([]);
                setMeta(null);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchPage();
    }, [page, perPage, refreshToken]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Permissions
                </h1>
                <p className="text-muted-foreground text-sm">
                    Manage system permissions. Changes here affect which actions can be
                    assigned to roles.
                </p>
            </div>

            {canCreate && (
                <div className="flex justify-end">
                    <Button size="sm" onClick={openCreate}>
                        New Permission
                    </Button>
                </div>
            )}

            {error && (
                <div className="text-destructive text-sm">{error}</div>
            )}

            <DataTableServer<Permission>
                columns={columns}
                data={data}
                isLoading={isLoading}
                emptyMessage="No permissions found."
                meta={meta}
                page={page}
                onPageChange={setPage}
                perPage={perPage}
                onPerPageChange={(next) => {
                    setPage(1);
                    setPerPage(next);
                }}
            />

            {/* Create dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Permission</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <Input
                            placeholder="Key (e.g. user.view)"
                            value={formKey}
                            onChange={(e) => setFormKey(e.target.value)}
                        />
                        <Input
                            placeholder="Display name"
                            value={formDisplayName}
                            onChange={(e) => setFormDisplayName(e.target.value)}
                        />
                        <Input
                            placeholder="Module (e.g. user)"
                            value={formModule}
                            onChange={(e) => setFormModule(e.target.value)}
                        />
                        <Input
                            placeholder="Description (optional)"
                            value={formDescription}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormDescription(e.target.value)
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => {
                                if (isSubmitting) return;
                                setIsCreateOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isSubmitting}
                            onClick={async () => {
                                if (isSubmitting) return;
                                setIsSubmitting(true);
                                try {
                                    await createPermission({
                                        key: formKey,
                                        display_name: formDisplayName,
                                        module: formModule,
                                        description: formDescription || undefined,
                                    });
                                    toast.success("Permission created.");
                                    setIsCreateOpen(false);
                                    setPage(1);
                                    setRefreshToken((v) => v + 1);
                                } catch {
                                    toast.error("Failed to create permission.");
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Permission</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-2 text-sm text-muted-foreground">
                        <div>Key: {activePermission?.key}</div>
                        <div>Module: {activePermission?.module}</div>
                    </div>
                    <div className="flex flex-col gap-4 py-2">
                        <Input
                            placeholder="Display name"
                            value={formDisplayName}
                            onChange={(e) => setFormDisplayName(e.target.value)}
                        />
                        <Input
                            placeholder="Description (optional)"
                            value={formDescription}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormDescription(e.target.value)
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => {
                                if (isSubmitting) return;
                                setIsEditOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isSubmitting}
                            onClick={async () => {
                                if (!activePermission || isSubmitting) return;
                                setIsSubmitting(true);
                                try {
                                    await updatePermission(activePermission.id, {
                                        display_name: formDisplayName,
                                        description: formDescription || undefined,
                                    });
                                    toast.success("Permission updated.");
                                    setIsEditOpen(false);
                                    setRefreshToken((v) => v + 1);
                                } catch {
                                    toast.error("Failed to update permission.");
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Permission</DialogTitle>
                    </DialogHeader>
                    <p className="py-2 text-sm text-muted-foreground">
                        Are you sure you want to delete permission{" "}
                        <span className="font-semibold">
                            {activePermission?.display_name ?? activePermission?.key}
                        </span>
                        ?
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => {
                                if (isSubmitting) return;
                                setIsDeleteOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={async () => {
                                if (!activePermission || isSubmitting) return;
                                setIsSubmitting(true);
                                try {
                                    await deletePermission(activePermission.id);
                                    toast.success("Permission deleted.");
                                    setIsDeleteOpen(false);
                                    // ensure we don't end up on an empty page after delete
                                    setRefreshToken((v) => v + 1);
                                } catch {
                                    toast.error(
                                        "Failed to delete permission. It may be in use by a role.",
                                    );
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            {isSubmitting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PermissionsPage;

