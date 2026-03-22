# Role Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

The Role module manages roles within a company. A role is the central access bundle — it holds three things simultaneously:

1. **Features** — which pages the user can visit (`role_features`)
2. **Permissions** — what actions the user can perform inside those pages (`role_permissions`)
3. **Networks** — which networks the user can see data from (`role_networks`)

Roles are scoped to a company via `role_companies`. A role belongs to exactly one company. **Superadmin** creates and manages roles for any company. The API may also allow **company admin** access to role endpoints when policy permits — see the Auth Mechanism table below. **Product stance:** the current **iot-dashboard** restricts Role Management UI to **superadmins** only; the operator provisions companies and roles while tenants manage **users**. See **`docs/BLUEPRINT.md` — Operating model (current)**.

```
Role ──(role_companies)──   Company     role belongs to one company
Role ──(role_features)──    Feature     which pages this role unlocks
Role ──(role_permissions)── Permission  what actions this role can perform
Role ──(role_networks)──    Network     which networks this role can see
                                        (constrained to company_networks)
```

---

## Auth Mechanism

Same as all other modules — cookie-based Sanctum (ADR-001).

| Endpoint | Who can access |
|----------|---------------|
| `GET /roles` | Superadmin OR company admin (scoped to own company) |
| `GET /roles/{id}` | Superadmin OR company admin (own company only) |
| `POST /roles` | Superadmin OR company admin with `role.create` |
| `PUT /roles/{id}` | Superadmin OR company admin with `role.update` (own company only) |
| `DELETE /roles/{id}` | Superadmin OR company admin with `role.delete` (own company only) |
| `GET /roles/options` | All authenticated users |

---

## Existing Pivots (Already in DB — No New Migrations Needed)

All pivots required by the Role module already exist:

| Pivot | Migration file | Status |
|-------|---------------|--------|
| `role_companies` | `0001_01_01_000006` | ✅ Exists |
| `role_permissions` | (permissions migration) | ✅ Exists |
| `role_networks` | `0001_01_01_000009` | ✅ Exists |
| `role_features` | Feature module migration | Created by Feature module |

**The Role module needs zero new migrations** — all pivots were created by earlier modules.

---

## Migration

No new tables. The `roles` table already exists (check your migration files — it was created as part of the base user/auth setup).

The `roles` table should have at minimum:
```
roles
├── id
├── name          string
├── is_system_role boolean, default false
└── timestamps
```

If `is_system_role` is missing, add it via a separate migration.

---

## GET /api/v1/roles/options

Already defined in the User module contract. Returns roles scoped to a company for the user create/edit form dropdown.

**Query:** `?company_id=1` required for superadmin; ignored for company admin.

**Scoping:**
- Company admin: own company's roles only
- Superadmin: roles for the specified company_id

```json
{
  "data": [
    { "id": 1, "name": "Operator", "is_system_role": false },
    { "id": 2, "name": "Viewer",   "is_system_role": false }
  ]
}
```

---

## Pagination (GET /api/v1/roles)

Accepts `?page` and `?per_page` (1–100, default 15).

**Scoping:**
- Company admin: own company's roles only (filtered server-side)
- Superadmin: accepts `?company_id` filter to view a specific company's roles; without it sees all roles

| Query param | Type | Description |
|-------------|------|-------------|
| `search` | string | Full-text on `name` |
| `company_id` | integer | Superadmin only — filter by company |

---

## API Response Shape (RoleResource)

```json
{
  "id": 1,
  "name": "Operator",
  "is_system_role": false,
  "company": { "id": 1, "name": "Acme Corp", "code": "ACME" },
  "features": [
    { "id": 1, "key": "dashboard",         "name": "Dashboard",         "icon": "LayoutDashboard" },
    { "id": 2, "key": "fire-extinguisher", "name": "Fire Extinguisher", "icon": "FlameKindling"   },
    { "id": 3, "key": "nodes",             "name": "Nodes",             "icon": "Cpu"              }
  ],
  "permissions": [
    { "id": 1, "key": "node.view",     "display_name": "View Nodes"     },
    { "id": 2, "key": "node.export",   "display_name": "Export Nodes"   },
    { "id": 3, "key": "alert.acknowledge", "display_name": "Acknowledge Alerts" }
  ],
  "networks": [
    { "id": 1, "name": "Building A", "network_address": "0xA1B2C3" },
    { "id": 2, "name": "Building B", "network_address": "0xD4E5F6" }
  ],
  "features_count": 3,
  "permissions_count": 3,
  "networks_count": 2,
  "users_count": 8,
  "created_at": "2026-01-01T00:00:00+00:00",
  "updated_at": "2026-01-01T00:00:00+00:00"
}
```

**Field notes:**
- `company` — the company this role belongs to (from `role_companies` pivot, always exactly one)
- `features` — from `role_features` pivot, ordered by `sort_order`
- `permissions` — from `role_permissions` pivot
- `networks` — from `role_networks` pivot
- `users_count` — count of users assigned to this role
- `is_system_role = true` — cannot be deleted or modified

---

## Request Payloads

### POST /api/v1/roles

```json
{
  "name": "string",
  "company_id": 1,
  "is_system_role": false,
  "feature_ids": [1, 2, 3],
  "permission_ids": [1, 2, 3],
  "network_ids": [1, 2]
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `name` | required, string, max:255 |
| `company_id` | required, integer, exists:companies,id; superadmin only (company admin uses own company_id automatically) |
| `is_system_role` | optional, boolean, default false; superadmin only — prohibited for company admin |
| `feature_ids` | optional, array; each item exists:features,id and `is_active=true` and NOT in `admin` group |
| `permission_ids` | optional, array; each item exists:permissions,id |
| `network_ids` | optional, array; each item exists:networks,id AND exists in `company_networks` for this role's company |

**Company admin behaviour:** `company_id` is automatically set to their own `company_id` — they cannot send `company_id` in the payload (prohibited).

### PUT /api/v1/roles/{id}

Same fields as POST, all optional. Same validation rules when present.

- `company_id` — prohibited on PUT (a role cannot be moved between companies)
- `is_system_role` — prohibited for non-superadmin
- All three pivot assignments (`feature_ids`, `permission_ids`, `network_ids`) are **replace-all**: sending `[]` clears that pivot. Omitting the field entirely leaves it unchanged.

---

## Permission Keys for this Module

| Permission key | Enforced in | Purpose |
|----------------|-------------|---------|
| `role.view` | `RoleController@index`, `@show` | List and view roles |
| `role.create` | `StoreRoleRequest::authorize()` | Create role |
| `role.update` | `UpdateRoleRequest::authorize()` | Update role |
| `role.delete` | `RoleController@destroy` | Delete role |

**Scoping notes:**
- Superadmin bypasses all checks and sees all roles.
- Company admin with `role.view` sees only roles in their own company.
- Company admin with `role.create` can create roles only for their own company.
- Company admin with `role.update` can edit roles only in their own company.

---

## Business Rules

1. **Role cannot be deleted** if it has users assigned. API returns `409 Conflict: { message: "Role has active users and cannot be deleted." }`.
2. **`is_system_role = true`** — cannot be deleted or modified (even by superadmin). API returns `403`.
3. **`company_id` is immutable** after creation (`prohibited` on PUT). A role cannot be moved between companies.
4. **`network_ids` must be in `company_networks`** for the role's company. The API validates this: any `network_id` not in `company_networks` for the role's company returns `422`. This is the enforcement point for the network access control model.
5. **`feature_ids` cannot include `admin` group features.** Those pages are superadmin-only and cannot be assigned via roles.
6. **All three pivots are replace-all** on update. Sending `feature_ids: []` clears all features. Omitting `feature_ids` entirely leaves the pivot unchanged.
7. **Company admin cannot set `is_system_role`** — prohibited on both create and update.
8. **`role.options`** returns only roles for the requested company. Company admin always gets their own company's roles regardless of query params.

---

## Frontend UI Notes

### SPA routing (current product decision)

- **Roles UI** (`/roles`, `/roles/create`, `/roles/:id/edit`) is mounted under **`SuperadminOutlet`** in `AppRouter` — only users with `is_superadmin` can reach these routes (redirect to `/` otherwise).
- Static sidebar entry lives under the **Superadmin** nav group (`nav.ts`: `superadminOnly` + `featureKey: "roles"`).
- **Tenant / company-admin** role management in the SPA is **out of scope until explicitly specified**; the API contract above still describes server-side capability for a future phase.

### Roles List Page

- Route: `/roles` (superadmin-only route shell **and** `canViewRoles()` for in-page actions)
- Layout: `DashboardLayout`
- Uses `DataTableServer` — no custom table, wrap in `<div className="overflow-x-auto">`
- Table columns: Name | Company (superadmin only column) | Features (count badge) | Permissions (count badge) | Networks (count badge) | Users (count badge) | System (badge if `is_system_role`) | Actions
- Filters: Search (name) | Company filter (superadmin only — uses `useCompanyOptions()`)
- Create button → `RoleFormDialog` (create mode) — only when `canCreateRole()`
- Edit button → `RoleFormDialog` (edit mode) — only when `canUpdateRole()`, hidden for `is_system_role`
- Delete button → confirm dialog — only when `canDeleteRole()`, disabled when role has users, hidden for `is_system_role`

### RoleFormDialog

This is the most complex dialog in the system — it assigns all three access layers simultaneously.

Mandatory responsive structure:
```tsx
<DialogContent className="w-full max-w-3xl max-h-[90vh] flex flex-col gap-0">
  <DialogHeader className="px-6 pt-6 pb-4 shrink-0">...</DialogHeader>
  <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-6">
    { sections }
  </div>
  <DialogFooter className="px-6 py-4 shrink-0 border-t">...</DialogFooter>
</DialogContent>
```

Note: `max-w-3xl` instead of `max-w-2xl` because this dialog has three multi-select sections.

**Section 1 — Identity:**
- Name (Input)
- Company (Select — superadmin only; company admin sees their own company as read-only label)
- Is System Role (Switch — superadmin only)

**Section 2 — Features (which pages):**
- Fetched via `getFeatureOptions()` — grouped response, excludes admin group
- Render each group as a labelled section
- Checkbox per feature showing: icon (small) + name
- "Select all" toggle per group (local state only)
- `max-h-56 overflow-y-auto border rounded-md p-3`

**Section 3 — Permissions (what actions):**
- Fetched via `getPermissionsGrouped()` — grouped by module
- Render each module as a labelled section
- Checkbox per permission showing: display_name + key (muted, small)
- "Select all" toggle per group (local state only)
- `max-h-56 overflow-y-auto border rounded-md p-3`

**Section 4 — Networks (which networks):**
- Fetched via `useNetworkOptions()` when dialog opens for the selected company
- For company admin: their company's networks from `company_networks`
- For superadmin: networks for the selected company_id (re-fetched when company changes)
- Checkbox per network: name + `network_address` monospace badge
- `max-h-48 overflow-y-auto border rounded-md p-2`

**On submit:**
```ts
{
  name: string,
  company_id: number,             // superadmin only
  is_system_role: boolean,        // superadmin only
  feature_ids: number[],          // checked feature IDs
  permission_ids: number[],       // checked permission IDs
  network_ids: number[],          // checked network IDs
}
```

### Scoping & Visibility

- Company admin sees only their own company's roles on the list page
- Company admin's `RoleFormDialog` has no company selector — their company is shown as a read-only label
- `is_system_role` switch and the company selector are rendered only for superadmin
- Superadmin sees a company filter on the list page (uses `useCompanyOptions()`)

---

## TypeScript Types (`src/types/role.ts`)

```ts
// src/types/role.ts

export interface RoleFeature {
  id: number;
  key: string;
  name: string;
  icon: string | null;
}

export interface RolePermission {
  id: number;
  key: string;
  display_name: string;
}

export interface RoleNetwork {
  id: number;
  name: string;
  network_address: string;
}

export interface RoleCompany {
  id: number;
  name: string;
  code: string;
}

export interface Role {
  id: number;
  name: string;
  is_system_role: boolean;
  company: RoleCompany;
  features: RoleFeature[];
  permissions: RolePermission[];
  networks: RoleNetwork[];
  features_count: number;
  permissions_count: number;
  networks_count: number;
  users_count: number;
  created_at: string;
  updated_at: string;
}

export interface RoleListResponse {
  data: Role[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    next: string | null;
    prev: string | null;
    last: string;
  };
}

export interface RoleOption {
  id: number;
  name: string;
  is_system_role: boolean;
}

export interface StoreRolePayload {
  name: string;
  company_id?: number;        // superadmin only
  is_system_role?: boolean;   // superadmin only
  feature_ids?: number[];
  permission_ids?: number[];
  network_ids?: number[];
}

export interface UpdateRolePayload {
  name?: string;
  is_system_role?: boolean;   // superadmin only
  feature_ids?: number[];
  permission_ids?: number[];
  network_ids?: number[];
  // company_id is prohibited on PUT
}
```

---

## API File (`src/api/roles.ts`)

```ts
// src/api/roles.ts
// API functions for Role module endpoints

import axiosClient from './axiosClient';
import type {
  Role,
  RoleListResponse,
  RoleOption,
  StoreRolePayload,
  UpdateRolePayload,
} from '@/types/role';

export const getRoles = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  company_id?: number;
}): Promise<RoleListResponse> => {
  const res = await axiosClient.get('/v1/roles', { params });
  return res.data;
};

export const getRoleOptions = async (params?: {
  company_id?: number;
}): Promise<{ data: RoleOption[] }> => {
  const res = await axiosClient.get('/v1/roles/options', { params });
  return res.data;
};

export const getRole = async (id: number): Promise<{ data: Role }> => {
  const res = await axiosClient.get(`/v1/roles/${id}`);
  return res.data;
};

export const createRole = async (
  payload: StoreRolePayload
): Promise<{ data: Role }> => {
  const res = await axiosClient.post('/v1/roles', payload);
  return res.data;
};

export const updateRole = async (
  id: number,
  payload: UpdateRolePayload
): Promise<{ data: Role }> => {
  const res = await axiosClient.put(`/v1/roles/${id}`, payload);
  return res.data;
};

export const deleteRole = async (id: number): Promise<void> => {
  await axiosClient.delete(`/v1/roles/${id}`);
};
```

---

## Checklist Before Implementation

### API
- [ ] Confirm `roles` table has `is_system_role` column — add via migration if missing
- [ ] No new pivot migrations needed — all exist already
- [ ] `RoleResource` shape matches contract exactly (company, features, permissions, networks, all counts)
- [ ] `StoreRoleRequest::authorize()` — superadmin OR (has `role.create` AND own company)
- [ ] `UpdateRoleRequest::authorize()` — superadmin OR (has `role.update` AND own company role)
- [ ] `company_id` prohibited on PUT
- [ ] `is_system_role` prohibited for non-superadmin on both store and update
- [ ] All three pivots use `sync()` — replace-all when present, skip when omitted
- [ ] `network_ids` validation: each ID must exist in `company_networks` for the role's company
- [ ] `feature_ids` validation: each ID must be `is_active=true` and NOT in `admin` group
- [ ] `is_system_role = true` — role cannot be deleted or updated (403)
- [ ] Role delete: check `users` table → 409 if users assigned
- [ ] `/options` scoped by company: company admin auto-scoped, superadmin needs `?company_id`
- [ ] `/options` route registered before `apiResource`
- [ ] PermissionSeeder: add `role.view`, `role.create`, `role.update`, `role.delete`
- [ ] Feature tests: full coverage including network constraint validation, feature admin group exclusion, system role protection, all pivot replace-all behaviour

### Frontend
- [ ] `src/types/role.ts` — all interfaces
- [ ] `src/api/roles.ts` — all functions
- [ ] `src/hooks/useRolePermissions.ts` — `canViewRoles()`, `canCreateRole()`, `canUpdateRole()`, `canDeleteRole()`
- [ ] `src/hooks/useRoles.ts` — `useRoles()`, `useRole(id)`, `useRoleOptions(companyId?)`
- [ ] `src/pages/roles/RolesPage.tsx` — `DataTableServer`, correct columns, company filter for superadmin
- [ ] `src/components/shared/RoleFormDialog.tsx` — `max-w-3xl`, 4 sections, all three assignment panels
- [ ] Section 2 (Features): `getFeatureOptions()` — grouped, excludes admin group, checkbox per feature
- [ ] Section 3 (Permissions): `getPermissionsGrouped()` — grouped by module, checkbox per permission
- [ ] Section 4 (Networks): `getNetworkOptions()` scoped to selected company — re-fetched on company change
- [ ] Routes added to `AppRouter.tsx` — under `SuperadminOutlet` (superadmin-only); not `FeatureRoute` alone
- [ ] Sidebar link from `user.features` (dynamic) — no static nav entry needed
- [ ] System role rows: no Edit or Delete buttons
- [ ] Delete disabled + tooltip when role has users
- [ ] Company admin: no company selector, no is_system_role switch
- [ ] Submit buttons: disabled + spinner while in-flight
- [ ] "Select all" toggles per group in Sections 2 and 3 (local state only)
- [ ] All strings in `src/constants/strings.ts`
- [ ] Dark mode variants on all custom styles

---

## Open Questions

- [ ] Should company admin be able to see `is_system_role` roles in their company's role list (read-only)? Recommend yes — they need to understand why those roles can't be modified.
- [ ] When superadmin changes selected company in `RoleFormDialog`, the networks section must re-fetch using the new company_id. Confirm this re-fetch behaviour is acceptable UX (brief loading state in the networks panel).
- [ ] `role.options` — should it return `features`, `permissions`, and `networks` for each role option, or just `id`, `name`, `is_system_role`? Recommend lightweight (id + name + is_system_role) since it's for a dropdown only.