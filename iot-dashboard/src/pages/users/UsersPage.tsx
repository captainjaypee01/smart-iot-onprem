// src/pages/users/UsersPage.tsx
// Users list and management — table, invite dialog, edit dialog, disable/resend/delete (role-based).
// Role dropdown uses useRoles(companyId); companyId from selected company (superadmin) or auth user company (company admin).

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { useUsers } from "@/hooks/useUsers";
import { useRole } from "@/hooks/useRole";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useRoles } from "@/hooks/useRoles";
import { DataTableServer, type DataTableColumn } from "@/components/shared/DataTableServer";
import { useCompanies } from "@/hooks/useCompanies";
import { useAuthStore } from "@/store/authStore";
import {
    storeUser,
    updateUser,
    deleteUser,
    resendInvite,
    disableUser,
} from "@/api/users";
import type { User, StoreUserPayload, UpdateUserPayload } from "@/types/user";
import type { CompanyOption } from "@/api/settings";
import { USER_STRINGS, UI_STRINGS, PAGE_SIZE_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";
import { UserPlus, Pencil, Mail, Trash2, ShieldOff } from "lucide-react";

const formatDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
};

interface InviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    isSuperAdmin: boolean;
    /** When not superadmin, company admin's company id (roles scoped to this). */
    companyAdminCompanyId: number | null;
    /** Lifted from parent so companies are fetched once for the page. */
    companies: CompanyOption[];
    companiesLoading: boolean;
}

const InviteDialog = ({
    open,
    onOpenChange,
    onSuccess,
    isSuperAdmin,
    companyAdminCompanyId,
    companies,
    companiesLoading,
}: InviteDialogProps) => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [roleId, setRoleId] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [useInvite, setUseInvite] = useState(true);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const effectiveCompanyId: number | null = isSuperAdmin
        ? (selectedCompanyId ? parseInt(selectedCompanyId, 10) : null)
        : companyAdminCompanyId;

    const { roles, isLoading: rolesLoading } = useRoles(effectiveCompanyId);

    const resetForm = useCallback(() => {
        setFirstName("");
        setLastName("");
        setEmail("");
        setUsername("");
        setSelectedCompanyId("");
        setRoleId("");
        setUseInvite(true);
        setPassword("");
        setPasswordConfirm("");
    }, []);

    const handleSubmit = useCallback(async () => {
        const first = firstName.trim();
        const last = lastName.trim();
        const em = email.trim();
        if (!first || !last || !em) return;
        if (effectiveCompanyId == null) {
            toast.error(USER_STRINGS.ERROR_SAVE);
            return;
        }
        const rId = roleId ? parseInt(roleId, 10) : null;
        if (rId == null) {
            toast.error(USER_STRINGS.ERROR_SAVE);
            return;
        }
        // When superadmin chooses direct password create, validate password locally
        if (isSuperAdmin && !useInvite) {
            if (password.length < 8 || password !== passwordConfirm) {
                toast.error(USER_STRINGS.ERROR_SAVE);
                return;
            }
        }
        setSubmitting(true);
        try {
            const payload: StoreUserPayload = {
                first_name: first,
                last_name: last,
                email: em,
                username: username.trim() || null,
                company_id: effectiveCompanyId,
                role_id: rId,
            };
            if (isSuperAdmin && !useInvite) {
                payload.use_invite = false;
                payload.password = password;
            }
            await storeUser(payload);
            toast.success(USER_STRINGS.USER_INVITED);
            resetForm();
            onOpenChange(false);
            onSuccess();
        } catch {
            toast.error(USER_STRINGS.ERROR_SAVE);
        } finally {
            setSubmitting(false);
        }
    }, [
        firstName,
        lastName,
        email,
        username,
        effectiveCompanyId,
        roleId,
        onOpenChange,
        onSuccess,
        resetForm,
        isSuperAdmin,
        useInvite,
        password,
        passwordConfirm,
    ]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border">
                <DialogHeader>
                    <DialogTitle>{USER_STRINGS.INVITE_USER}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="invite-first-name">{USER_STRINGS.FIRST_NAME}</Label>
                        <Input
                            id="invite-first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="invite-last-name">{USER_STRINGS.LAST_NAME}</Label>
                        <Input
                            id="invite-last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="invite-email">{USER_STRINGS.EMAIL}</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="invite-username">{USER_STRINGS.USERNAME}</Label>
                        <Input
                            id="invite-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={UI_STRINGS.N_A}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    {isSuperAdmin && (
                        <div className="grid gap-2">
                            <Label>{USER_STRINGS.COMPANY}</Label>
                            <Select
                                value={selectedCompanyId || undefined}
                                onValueChange={setSelectedCompanyId}
                                disabled={companiesLoading}
                            >
                                <SelectTrigger className="bg-background dark:bg-background">
                                    <SelectValue
                                        placeholder={USER_STRINGS.NO_COMPANY}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name} ({c.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {isSuperAdmin && (
                        <div className="grid gap-2">
                            <Label>{USER_STRINGS.INVITE_USER}</Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                                <input
                                    id="invite-use-invite"
                                    type="checkbox"
                                    checked={useInvite}
                                    onChange={(e) => setUseInvite(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Label
                                    htmlFor="invite-use-invite"
                                    className="text-xs font-normal text-muted-foreground dark:text-muted-foreground"
                                >
                                    Send invite email (uncheck to set password now)
                                </Label>
                            </div>
                        </div>
                    )}
                    {isSuperAdmin && !useInvite && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="invite-password">Password</Label>
                                <Input
                                    id="invite-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-background dark:bg-background"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="invite-password-confirm">Confirm password</Label>
                                <Input
                                    id="invite-password-confirm"
                                    type="password"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className="bg-background dark:bg-background"
                                />
                            </div>
                        </>
                    )}
                    <div className="grid gap-2">
                        <Label>{USER_STRINGS.ROLE}</Label>
                        <Select
                            value={roleId || undefined}
                            onValueChange={setRoleId}
                            disabled={effectiveCompanyId == null || rolesLoading}
                        >
                            <SelectTrigger className="bg-background dark:bg-background">
                                <SelectValue placeholder={effectiveCompanyId == null ? USER_STRINGS.SELECT_COMPANY_FIRST : USER_STRINGS.NO_ROLE} />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                        {r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {UI_STRINGS.CANCEL}
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {UI_STRINGS.SAVE}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface EditDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    isSuperAdmin: boolean;
    /** Lifted from parent so companies are fetched once for the page. */
    companies: CompanyOption[];
    companiesLoading: boolean;
}

const EditDialog = ({
    user,
    open,
    onOpenChange,
    onSuccess,
    isSuperAdmin,
    companies,
    companiesLoading,
}: EditDialogProps) => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [roleId, setRoleId] = useState<string>("");
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [status, setStatus] = useState<"active" | "locked" | "disabled">("active");
    const [submitting, setSubmitting] = useState(false);

    const { canChangeCompany, canChangeStatus } = useUserPermissions();

    const effectiveCompanyId: number | null = isSuperAdmin
        ? selectedCompanyId
            ? parseInt(selectedCompanyId, 10)
            : user?.company?.id ?? null
        : user?.company?.id ?? null;

    const { roles, isLoading: rolesLoading } = useRoles(effectiveCompanyId);

    useEffect(() => {
        if (open && user) {
            setFirstName(user.first_name);
            setLastName(user.last_name);
            setEmail(user.email);
            setUsername(user.username ?? "");
            setRoleId(user.role?.id != null ? String(user.role.id) : "");
            setSelectedCompanyId(user.company?.id != null ? String(user.company.id) : "");
            setStatus(user.status);
        }
    }, [open, user]);

    const handleSubmit = useCallback(async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            const payload: UpdateUserPayload = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                username: username.trim() || null,
            };
            if (roleId) payload.role_id = parseInt(roleId, 10);
            else payload.role_id = null;
            if (isSuperAdmin && canChangeCompany() && effectiveCompanyId != null) {
                payload.company_id = effectiveCompanyId;
            }
            if (isSuperAdmin && canChangeStatus()) {
                payload.status = status;
            }
            await updateUser(user.id, payload);
            toast.success(USER_STRINGS.USER_UPDATED);
            onOpenChange(false);
            onSuccess();
        } catch {
            toast.error(USER_STRINGS.ERROR_SAVE);
        } finally {
            setSubmitting(false);
        }
    }, [
        user,
        firstName,
        lastName,
        email,
        username,
        roleId,
        effectiveCompanyId,
        status,
        isSuperAdmin,
        canChangeCompany,
        canChangeStatus,
        onOpenChange,
        onSuccess,
    ]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border">
                <DialogHeader>
                    <DialogTitle>{USER_STRINGS.EDIT_USER}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-first-name">{USER_STRINGS.FIRST_NAME}</Label>
                        <Input
                            id="edit-first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-last-name">{USER_STRINGS.LAST_NAME}</Label>
                        <Input
                            id="edit-last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-email">{USER_STRINGS.EMAIL}</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-username">{USER_STRINGS.USERNAME}</Label>
                        <Input
                            id="edit-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={UI_STRINGS.N_A}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    {isSuperAdmin && canChangeCompany() && (
                        <div className="grid gap-2">
                            <Label>{USER_STRINGS.COMPANY}</Label>
                            <Select
                                value={selectedCompanyId || undefined}
                                onValueChange={setSelectedCompanyId}
                                disabled={companiesLoading}
                            >
                                <SelectTrigger className="bg-background dark:bg-background">
                                    <SelectValue
                                        placeholder={
                                            user?.company
                                                ? `${user.company.name} (${user.company.code})`
                                                : USER_STRINGS.NO_COMPANY
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name} ({c.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label>{USER_STRINGS.ROLE}</Label>
                        <Select
                            value={roleId || undefined}
                            onValueChange={setRoleId}
                            disabled={effectiveCompanyId == null || rolesLoading}
                        >
                            <SelectTrigger className="bg-background dark:bg-background">
                                <SelectValue
                                    placeholder={
                                        effectiveCompanyId == null
                                            ? USER_STRINGS.SELECT_COMPANY_FIRST
                                            : USER_STRINGS.NO_ROLE
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                        {r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {isSuperAdmin && canChangeStatus() && (
                        <div className="grid gap-2">
                            <Label>{USER_STRINGS.STATUS}</Label>
                            <Select
                                value={status}
                                onValueChange={(v) =>
                                    setStatus(v as "active" | "locked" | "disabled")
                                }
                            >
                                <SelectTrigger className="bg-background dark:bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">{USER_STRINGS.ACTIVE}</SelectItem>
                                    <SelectItem value="locked">Locked</SelectItem>
                                    <SelectItem value="disabled">
                                        {USER_STRINGS.INACTIVE}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {UI_STRINGS.CANCEL}
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {UI_STRINGS.SAVE}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const UsersPage = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((s) => s.user);
    const { users, meta, page, setPage, perPage, setPerPage, isLoading, error, refetch } =
        useUsers();
    const { isSuperAdmin } = useRole();
    const {
        canViewUsers,
        canCreateUser,
        canUpdateUser,
        canDisableUser,
        canResendInvite,
        canDeleteUser,
    } = useUserPermissions();
    const { companies, isLoading: companiesLoading } = useCompanies();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    if (!canViewUsers()) {
        navigate("/", { replace: true });
        return null;
    }

    const companyAdminCompanyId =
        !isSuperAdmin() && authUser?.company?.id != null ? authUser.company.id : null;

    const handleResend = async (id: number) => {
        try {
            await resendInvite(id);
            toast.success(USER_STRINGS.INVITE_RESENT);
            refetch();
        } catch {
            toast.error(USER_STRINGS.ERROR_RESEND);
        }
    };

    const handleDisable = async (id: number, currentlyActive: boolean) => {
        try {
            await disableUser(id);
            toast.success(
                currentlyActive ? USER_STRINGS.USER_DISABLED : USER_STRINGS.USER_ENABLED
            );
            refetch();
        } catch {
            toast.error(USER_STRINGS.ERROR_DISABLE);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(USER_STRINGS.CONFIRM_DELETE)) return;
        try {
            await deleteUser(id);
            toast.success(USER_STRINGS.USER_DELETED);
            refetch();
        } catch {
            toast.error(USER_STRINGS.ERROR_DELETE);
        }
    };

    const columns: DataTableColumn<User>[] = [
        {
            id: "name",
            header: USER_STRINGS.NAME,
            cell: (u) => (
                <span className="font-medium text-foreground dark:text-foreground">
                    {u.name}
                </span>
            ),
        },
        {
            id: "company",
            header: USER_STRINGS.COMPANY,
            cell: (u) => (
                <span className="text-foreground dark:text-foreground">
                    {u.company ? `${u.company.name} (${u.company.code})` : USER_STRINGS.NO_COMPANY}
                </span>
            ),
        },
        {
            id: "email",
            header: USER_STRINGS.EMAIL,
            cell: (u) => (
                <span className="text-foreground dark:text-foreground">{u.email}</span>
            ),
        },
        {
            id: "role",
            header: USER_STRINGS.ROLE,
            cell: (u) => (
                <Badge
                    variant="secondary"
                    className={cn(
                        "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
                    )}
                >
                    {u.role?.name ?? USER_STRINGS.NO_ROLE}
                </Badge>
            ),
        },
        {
            id: "status",
            header: USER_STRINGS.STATUS,
            cell: (u) => (
                <Badge
                    variant={u.is_active ? "default" : "secondary"}
                    className={cn(
                        u.is_active
                            ? "bg-green-600 text-white dark:bg-green-600 dark:text-white"
                            : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
                    )}
                >
                    {u.is_active ? USER_STRINGS.ACTIVE : USER_STRINGS.INACTIVE}
                </Badge>
            ),
        },
        {
            id: "joined",
            header: USER_STRINGS.JOINED,
            cell: (u) => (
                <span className="text-muted-foreground dark:text-muted-foreground">
                    {formatDate(u.created_at)}
                </span>
            ),
        },
        {
            id: "actions",
            header: USER_STRINGS.ACTIONS,
            className: "w-[120px] text-right",
            cell: (u) => (
                <div className="flex items-center justify-end gap-1">
                    {canUpdateUser() && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setEditUser(u);
                                setEditOpen(true);
                            }}
                            aria-label={USER_STRINGS.EDIT_USER}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {canResendInvite() && u.last_login_at == null && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResend(u.id)}
                            aria-label={USER_STRINGS.RESEND_INVITE}
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                    )}
                    {canDisableUser() && !u.is_superadmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDisable(u.id, u.is_active)}
                            aria-label={
                                u.is_active ? USER_STRINGS.DISABLE : USER_STRINGS.ENABLE
                            }
                        >
                            <ShieldOff className="h-4 w-4" />
                        </Button>
                    )}
                    {canDeleteUser() && !u.is_superadmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(u.id)}
                            aria-label={USER_STRINGS.DELETE_USER}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-foreground">
                        {USER_STRINGS.TITLE}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                        {USER_STRINGS.SUBTITLE}
                    </p>
                </div>
                {canCreateUser() &&
                    (isSuperAdmin() || authUser?.company?.id != null) && (
                        <Button onClick={() => setInviteOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {USER_STRINGS.INVITE_USER}
                        </Button>
                    )}
            </div>

            {error && (
                <p className="text-sm text-destructive dark:text-destructive">
                    {error}
                </p>
            )}

            <DataTableServer<User>
                columns={columns}
                data={users}
                isLoading={isLoading}
                emptyMessage={USER_STRINGS.NO_USERS}
                meta={meta}
                page={page}
                onPageChange={setPage}
                perPage={perPage}
                onPerPageChange={setPerPage}
                perPageOptions={PAGE_SIZE_OPTIONS}
            />

            <InviteDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                onSuccess={refetch}
                isSuperAdmin={isSuperAdmin()}
                companyAdminCompanyId={companyAdminCompanyId}
                companies={companies}
                companiesLoading={companiesLoading}
            />
            <EditDialog
                user={editUser}
                open={editOpen}
                onOpenChange={(open) => {
                    if (!open) setEditUser(null);
                    setEditOpen(open);
                }}
                onSuccess={refetch}
                isSuperAdmin={isSuperAdmin()}
                companies={companies}
                companiesLoading={companiesLoading}
            />
        </div>
    );
};

export default UsersPage;
