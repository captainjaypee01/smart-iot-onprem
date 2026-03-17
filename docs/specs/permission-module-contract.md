# Permission Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview & Architecture Decision

### The Grouping Problem (and Solution)

The `permissions` table has a `module` column (e.g. `user`, `company`, `zone`). This column is the **group key** — it is used both for UI grouping and for seeding. No extra pivot table is needed.

**Approach chosen: Module-based grouping via the `module` field**

Permissions are seeded with a `module` value. The API returns them grouped by module. The frontend renders each group as a collapsible section (e.g. "User Management", "Company Management") with checkboxes per permission. This is the simplest approach consistent with the existing schema.

**Why not a separate `permission_groups` table?**
- The `module` field already exists on the `permissions` table.
- Adding a pivot table adds joins and complexity for no behavioral benefit.
- The display label for each group lives in a seeder/constant — it never changes at runtime.

**Group display names** (seeded, not stored in DB):
| module key | Display label |
|------------|---------------|
| `user` | User Management |
| `company` | Company Management |
| `role` | Role Management |
| `permission` | Permission Management |
| *(future modules)* | *(add in seeder + frontend constant)* |

---

## Auth Mechanism

Same as all other modules — cookie-based Sanctum (ADR-001).

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/permissions | sanctum | List all permissions, grouped by module |
| GET | /api/v1/permissions/{id} | sanctum | Single permission |
| POST | /api/v1/permissions | sanctum | Create permission |
| PUT | /api/v1/permissions/{id} | sanctum | Update permission |
| DELETE | /api/v1/permissions/{id} | sanctum | Delete permission (if not in use) |
| GET | /api/v1/permissions/options | sanctum | Flat list for dropdowns (not paginated) |

**Notes:**
- `GET /api/v1/permissions` returns a **grouped** structure (see response shape below) — it is **not paginated**. The total number of permissions is bounded and known at seed time.
- `GET /api/v1/permissions/options` returns a flat list for any future dropdown use.
- Permission records are **system-seeded** in practice. Create/Update/Delete endpoints exist for superadmin tooling but are not exposed in standard UI flows.

---

## GET /api/v1/permissions — Grouped Response

Used by the Role create/edit page to render the permission assignment UI.

**Query parameters:** none required. Superadmin only (or permission.view).

**Response:**
```json
{
  "data": [
    {
      "module": "user",
      "label": "User Management",
      "permissions": [
        { "id": 1, "key": "user.view", "display_name": "View Users", "description": "List and view user details" },
        { "id": 2, "key": "user.create", "display_name": "Create User", "description": "Invite or create a new user" },
        { "id": 3, "key": "user.update", "display_name": "Update User", "description": "Edit user details" },
        { "id": 4, "key": "user.delete", "display_name": "Delete User", "description": "Soft-delete a user" },
        { "id": 5, "key": "user.disable", "display_name": "Disable User", "description": "Toggle user active/inactive" },
        { "id": 6, "key": "user.resend_invite", "display_name": "Resend Invite", "description": "Resend welcome email" }
      ]
    },
    {
      "module": "company",
      "label": "Company Management",
      "permissions": [
        { "id": 7, "key": "company.view", "display_name": "View Companies", "description": "List and view companies" },
        { "id": 8, "key": "company.create", "display_name": "Create Company", "description": "Create a new company" },
        { "id": 9, "key": "company.update", "display_name": "Update Company", "description": "Edit company details" },
        { "id": 10, "key": "company.delete", "display_name": "Delete Company", "description": "Delete a company" }
      ]
    }
  ]
}
```

The `label` field is computed server-side from a static map (not stored in DB).

---

## GET /api/v1/permissions/options — Flat Response

Simple flat list for any future dropdown/search use.

```json
{
  "data": [
    { "id": 1, "key": "user.view", "display_name": "View Users", "module": "user" },
    { "id": 2, "key": "user.create", "display_name": "Create User", "module": "user" }
  ]
}
```

---

## API Response Shape (PermissionResource)

```json
{
  "id": 1,
  "key": "user.view",
  "display_name": "View Users",
  "module": "user",
  "description": "List and view user details",
  "created_at": "2026-01-01T00:00:00+00:00"
}
```

---

## Request Payloads

### POST /api/v1/permissions
```json
{
  "key": "string",
  "display_name": "string",
  "module": "string",
  "description": "string | null"
}
```

Validation:
- `key`: required, unique in `permissions`, format `{module}.{action}` (regex: `/^[a-z_]+\.[a-z_]+$/`)
- `display_name`: required, max 255
- `module`: required, lowercase, matches prefix of `key`
- `description`: optional

### PUT /api/v1/permissions/{id}
```json
{
  "display_name": "string?",
  "description": "string?"
}
```

Note: `key` and `module` are **immutable** after creation. API returns 422 if either is sent.

---

## Permission Keys for this Module

| Permission key | Enforced in | Purpose |
|----------------|-------------|---------|
| `permission.view` | `PermissionController@index`, `@show` | List and view permissions |
| `permission.create` | `StorePermissionRequest::authorize()` | Create a permission |
| `permission.update` | `UpdatePermissionRequest::authorize()` | Update a permission |
| `permission.delete` | `PermissionController@destroy` | Delete a permission |

**Notes:**
- Superadmin bypasses all checks.
- In practice, `permission.create/update/delete` are superadmin-only operations. Standard company admin roles will have only `permission.view`.

---

## Business Rules

- A permission **cannot be deleted** if it is currently assigned to any role (`role_permissions` FK). API returns `409 Conflict` with `{ message: "Permission is in use by one or more roles." }`.
- `key` is immutable after creation — changing it would silently break all permission checks.
- `module` is immutable after creation for the same reason.
- Permissions are **seeded** — the create/update UI is a superadmin-only safety valve, not a routine workflow.
- The frontend permission assignment UI (on the Role create/edit page) consumes `GET /api/v1/permissions` (grouped endpoint), not this module's CRUD pages.

---

## Frontend UI Notes

### Permission Assignment in Role Module (Primary use case)

The grouped endpoint drives the Role create/edit page. Render each group as a card or section:

```
[ User Management ]
  ☑ View Users       ☐ Create User
  ☑ Update User      ☐ Delete User
  ☐ Disable User     ☐ Resend Invite

[ Company Management ]
  ☑ View Companies   ☐ Create Company
  ...
```

- Checkbox state is a `Set<number>` of selected permission IDs in local component state.
- On form submit, send `permission_ids: number[]` to the Role API endpoint (see Role module contract).
- "Select all" toggle per group is a UX convenience — it is local state only.

### Permission CRUD Page (Secondary, superadmin only)

A standard table view with:
- Columns: Key, Display Name, Module (as badge), Description, Actions
- Grouped by module using table section headers or Tabs (shadcn `Tabs` component)
- Create/Edit via a Dialog (shadcn `Dialog`) — not a separate route
- Delete only enabled when permission is not in use (check API 409 response)

---

## TypeScript Types

```ts
// src/types/permission.ts

export interface Permission {
  id: number;
  key: string;
  display_name: string;
  module: string;
  description: string | null;
  created_at: string;
}

export interface PermissionGroup {
  module: string;
  label: string;
  permissions: Permission[];
}

export interface PermissionsGroupedResponse {
  data: PermissionGroup[];
}

export interface PermissionOption {
  id: number;
  key: string;
  display_name: string;
  module: string;
}
```

---

## API File (`src/api/permissions.ts`)

```ts
import axiosClient from "./axiosClient";
import type { Permission, PermissionsGroupedResponse, PermissionOption } from "@/types/permission";

export const getPermissionsGrouped = async (): Promise<PermissionsGroupedResponse> => {
  const res = await axiosClient.get("/permissions");
  return res.data;
};

export const getPermissionOptions = async (): Promise<{ data: PermissionOption[] }> => {
  const res = await axiosClient.get("/permissions/options");
  return res.data;
};

export const getPermission = async (id: number): Promise<{ data: Permission }> => {
  const res = await axiosClient.get(`/permissions/${id}`);
  return res.data;
};

export const createPermission = async (payload: {
  key: string;
  display_name: string;
  module: string;
  description?: string;
}): Promise<{ data: Permission }> => {
  const res = await axiosClient.post("/permissions", payload);
  return res.data;
};

export const updatePermission = async (
  id: number,
  payload: { display_name?: string; description?: string }
): Promise<{ data: Permission }> => {
  const res = await axiosClient.put(`/permissions/${id}`, payload);
  return res.data;
};

export const deletePermission = async (id: number): Promise<void> => {
  await axiosClient.delete(`/permissions/${id}`);
};
```