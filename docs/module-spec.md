# [Module Name] Module — Shared Contract

> **How to use this template:**
> Fill in every section. Delete placeholder text in angle brackets. Sections marked *(if applicable)* can be removed if not relevant. Both API (Laravel) and frontend (React) teams sign off before implementation begins.
>
> **File naming:** `docs/specs/[module-slug]-module-contract.md`

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

> Describe what this module does in 2–3 sentences. Who uses it? What problem does it solve?

---

## Auth Mechanism

> Usually just: "Same as all other modules — cookie-based Sanctum (ADR-001)."
> Note any exceptions (e.g. internal token for backend-only endpoints).

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/[resources] | sanctum | List [resources] (paginated) |
| GET | /api/v1/[resources]/{id} | sanctum | Single [resource] |
| POST | /api/v1/[resources] | sanctum | Create [resource] |
| PUT | /api/v1/[resources]/{id} | sanctum | Update [resource] |
| DELETE | /api/v1/[resources]/{id} | sanctum | Delete [resource] |
| GET | /api/v1/[resources]/options | sanctum | Flat list for dropdowns (not paginated) |
| POST | /api/v1/[resources]/{id}/[action] | sanctum | *(if applicable)* One-off state change |

**Notes:**
> - Call out any non-obvious routing decisions (e.g. why `/options` exists separately, pagination vs not).
> - Note which endpoints are superadmin-only.
> - Reference ADRs if relevant (e.g. ADR-013 for single-action controllers).

---

## GET /api/v1/[resources]/options *(if applicable)*

> Use this section if the module provides a dropdown/lookup endpoint.
> Keep shape fixed even when the full paginated index is added later.

**Scoping:**
- **Superadmin:** [describe what they see]
- **Company admin:** [describe scoping]

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "Example" }
  ]
}
```

---

## Pagination (GET /api/v1/[resources])

> Include this section if the index endpoint is paginated.

Accepts `?page` and `?per_page` (1–100, default 15).

**Response:**
```json
{
  "data": [[ResourceShape], ...],
  "meta": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 42 },
  "links": { "first": "...", "next": "...", "prev": null, "last": "..." }
}
```

**Available filters:**
| Query param | Type | Description |
|-------------|------|-------------|
| `search` | string | *(if applicable)* |
| `[field]` | string/int | *(add filters as needed)* |

---

## API Response Shape ([Resource]Resource)

> Define the exact JSON the API produces and the frontend consumes.
> Never expose: passwords, tokens, internal IDs that should be opaque.

```json
{
  "id": 1,
  "field_one": "string",
  "field_two": "string | null",
  "status": "active | inactive",
  "related_entity": { "id": 1, "name": "string" },
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

> Dates are ISO8601. Note nullable fields explicitly.

---

## Request Payloads

### POST /api/v1/[resources]

```json
{
  "field_one": "string",
  "field_two": "string | null",
  "related_id": 1
}
```

**Validation rules:**
- `field_one`: required, string, max 255
- `field_two`: optional, nullable
- `related_id`: required, exists in `[table]`
- *(list cross-table / compound validations explicitly, e.g. role_id must exist in role_companies for company_id)*

### PUT /api/v1/[resources]/{id}

```json
{
  "field_one": "string?",
  "field_two": "string?"
}
```

**Validation rules:**
> - Note any fields that are immutable after creation (use `prohibited` rule for non-superadmin).
> - Note any fields restricted to superadmin only.

---

## Permission Keys for this Module

| Permission key | Enforced in | Purpose |
|----------------|-------------|---------|
| `[module].view` | `[Resource]Controller@index`, `@show` | List and view |
| `[module].create` | `Store[Resource]Request::authorize()` | Create |
| `[module].update` | `Update[Resource]Request::authorize()` | Update |
| `[module].delete` | `[Resource]Controller@destroy` | Delete |
| `[module].[action]` | `[Action]Controller` | *(add one-off actions)* |

**Scoping notes:**
- **Superadmin:** bypasses all permission checks and company scope.
- **Company admin:** [describe company-scope enforcement, e.g. "can only act on records in their own company_id"].
- Any field-level restrictions (e.g. only superadmin can send `company_id`) go here.

---

## Business Rules

> List every rule both sides must enforce. Be explicit. Ambiguity here causes bugs.

- Rule 1: [e.g. "A [resource] cannot be deleted if it has active [related records]. API returns 409."]
- Rule 2: [e.g. "Superadmin cannot be [action]. API returns 403; frontend hides the button."]
- Rule 3: [e.g. "[Field] is immutable after creation."]
- Rule 4: [e.g. "User cannot perform [action] on themselves. API enforces; frontend hides button."]

---

## Frontend UI Notes

> Describe the UI without prescribing component internals. Focus on behavior, not implementation.

### [Page or Component Name]

- Route: `/[path]` (lazy loaded)
- Layout: `DashboardLayout`
- Primary action: [Create / Edit / View]
- [Describe the main table or form and its key columns/fields]
- [Describe any dialogs, modals, or drawers used]
- [Describe any conditional rendering based on user role/permission]
- [Describe any confirm dialogs for destructive actions]
 - [Describe loading behaviour: button-level spinners and disabled state while submitting, table-level skeletons or spinners while fetching]

### Scoping / visibility rules
- Superadmin sees: [describe]
- Company admin sees: [describe]
- Fields hidden for non-superadmin: [list]

---

## TypeScript Types

> Define the complete types for this module. These go in `src/types/[module].ts`.

```ts
// src/types/[module].ts

export interface [Resource] {
  id: number;
  field_one: string;
  field_two: string | null;
  status: "[value1]" | "[value2]";
  related_entity: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

// For paginated list responses
export interface [Resource]ListResponse {
  data: [Resource][];
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

// For simple option dropdowns
export interface [Resource]Option {
  id: number;
  name: string;
  // add any extra fields needed for display
}
```

---

## API File (`src/api/[module].ts`)

> Provide the full typed API file. This is the exact file the frontend will create at `src/api/[module].ts`.

```ts
// src/api/[module].ts
// API functions for [Module Name] endpoints

import axiosClient from "./axiosClient";
import type { [Resource], [Resource]ListResponse, [Resource]Option } from "@/types/[module]";

export const get[Resources] = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<[Resource]ListResponse> => {
  const res = await axiosClient.get("/[resources]", { params });
  return res.data;
};

export const get[Resource]Options = async (): Promise<{ data: [Resource]Option[] }> => {
  const res = await axiosClient.get("/[resources]/options");
  return res.data;
};

export const get[Resource] = async (id: number): Promise<{ data: [Resource] }> => {
  const res = await axiosClient.get(`/[resources]/${id}`);
  return res.data;
};

export const create[Resource] = async (payload: {
  // list required fields
}): Promise<{ data: [Resource] }> => {
  const res = await axiosClient.post("/[resources]", payload);
  return res.data;
};

export const update[Resource] = async (
  id: number,
  payload: {
    // list optional fields
  }
): Promise<{ data: [Resource] }> => {
  const res = await axiosClient.put(`/[resources]/${id}`, payload);
  return res.data;
};

export const delete[Resource] = async (id: number): Promise<void> => {
  await axiosClient.delete(`/[resources]/${id}`);
};

// Add one-off actions below as needed:
// export const [action][Resource] = async (id: number): Promise<void> => {
//   await axiosClient.post(`/[resources]/${id}/[action]`);
// };
```

---

## Checklist Before Implementation

> Both API and frontend leads tick these off before writing a single line of code.

### API
- [ ] Migration written and reviewed
- [ ] Seeder written (if applicable)
- [ ] `[Resource]Resource` shape matches the contract above exactly
- [ ] FormRequest `authorize()` implements permission + scope logic per PERMISSIONS.md pattern
- [ ] All validation rules from "Request Payloads" section are implemented
- [ ] All business rules enforced server-side
- [ ] Pagination implemented with correct meta/links shape
- [ ] Routes registered in `routes/api.php`
- [ ] Permission keys added to `PermissionSeeder`
- [ ] Feature tests cover: happy path, 401, 403, 404, 422, and all business rule edge cases

### Frontend
- [ ] Types added to `src/types/[module].ts`
- [ ] API file created at `src/api/[module].ts`
- [ ] Custom hook created at `src/hooks/use[Resources].ts`
- [ ] Page components created in `src/pages/[module]/`
- [ ] Route added to `src/routes/AppRouter.tsx` (lazy loaded)
- [ ] Superadmin-only UI elements are conditionally rendered
- [ ] Confirm dialogs on all destructive actions
- [ ] All user-facing strings in `src/constants/strings.ts`
- [ ] Dark mode variants present on all custom styles
 - [ ] All forms and state-changing actions show a clear loading state (disabled submit button with spinner) while the API request is in-flight

---

## Open Questions

> Use this section during spec review. Delete before marking the spec as final.

- [ ] [Question 1]
- [ ] [Question 2]