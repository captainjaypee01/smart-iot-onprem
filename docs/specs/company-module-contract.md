# Company Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

The Company module manages the tenant companies in the system. Each company groups users, roles, and networks together. A company is the root of the access model — users belong to a company, roles are scoped to a company via `role_companies`, and networks are assigned to a company via `company_networks`.

This module has two access faces:
- **Superadmin CRUD** — create, view, update, and delete any company
- **Company admin self-edit** — a company admin can update their own company's details only (limited fields)

```
Company ──(company_networks)──  Network   which networks are available to this company
Company ──(users.company_id)──  User      users belong to a company
Company ──(role_companies)──    Role      roles are scoped to a company
Role    ──(role_networks)──     Network   which networks a role can see
```

---

## Network Access Control Design

### The Goal
> User A (Role 1) can view Network 1 & 2.
> User B (Role 2) can view Network 2 only.

### Two pivot tables — already in the DB

**`company_networks`** (new — created by this module's migration)
Declares which networks are **available** to a company.
Managed by superadmin when creating or editing a company.

**`role_networks`** (`0001_01_01_000009` — already exists)
Declares which of the company's available networks a **role** can access.
Managed when creating or editing a role (Role module).
**Constraint:** a network can only appear in `role_networks` for a role if that network is already in `company_networks` for that role's company. The API enforces this on every role create/update.

### Flow
```
Superadmin assigns Networks 1, 2, 3 to Company A  →  company_networks
Role "Operator" in Company A gets Networks 1 & 2  →  role_networks
Role "Viewer"   in Company A gets Network 2 only  →  role_networks

User A has Role "Operator"  →  sees Networks 1 & 2
User B has Role "Viewer"    →  sees Network 2 only
```

---

## Auth Mechanism

Same as all other modules — cookie-based Sanctum (ADR-001).

| Endpoint | Who can access |
|----------|----------------|
| `GET /companies` (paginated index) | Superadmin only |
| `GET /companies/{id}` | Superadmin OR company admin of that company |
| `POST /companies` | Superadmin only |
| `PUT /companies/{id}` | Superadmin OR company admin of that company (field restrictions apply) |
| `DELETE /companies/{id}` | Superadmin only |
| `GET /companies/options` | All authenticated users |
| `POST /companies/{id}/logo` | Superadmin OR company admin of that company |

---

## Existing Migration (Keep As-Is)

`0001_01_01_000000_create_companies_table.php` — **do not modify this file**.

Current columns:
```
companies
├── id
├── name                 string
├── code                 string(20), unique   — short identifier e.g. ACME
├── address              text, nullable
├── contact_email        string, nullable
├── contact_phone        string(30), nullable
├── is_active            boolean, default true
└── timestamps
```

---

## New Migration — Add Columns + company_networks Pivot

Create a new migration file that:
1. Adds the missing columns to `companies` via `Schema::table`
2. Creates the `company_networks` pivot table

```php
// database/migrations/xxxx_add_fields_to_companies_and_create_company_networks.php

public function up(): void
{
    // Step 1: Add missing columns to companies
    Schema::table('companies', function (Blueprint $table) {
        $table->string('timezone', 100)->default('UTC')
            ->after('code')
            ->comment('PHP timezone string e.g. Asia/Singapore');

        $table->string('logo_path')->nullable()
            ->after('timezone')
            ->comment('Path on disk/S3. Served as signed URL.');

        $table->unsignedTinyInteger('login_attempts')->default(5)
            ->after('logo_path')
            ->comment('Max failed login attempts before lockout. Range 1-10.');

        $table->boolean('is_2fa_enforced')->default(false)
            ->after('login_attempts');

        $table->boolean('is_demo')->default(false)
            ->after('is_2fa_enforced');

        $table->boolean('is_active_zone')->default(true)
            ->after('is_demo');

        $table->unsignedSmallInteger('custom_alarm_threshold')->nullable()
            ->after('is_active_zone')
            ->comment('Overrides network alarm_threshold. Null = use network default.');

        $table->string('custom_alarm_threshold_unit', 10)->nullable()
            ->after('custom_alarm_threshold')
            ->comment('Allowed: minutes, hours. Null = use network default.');
    });

    // Step 2: Create company_networks pivot
    Schema::create('company_networks', function (Blueprint $table) {
        $table->foreignId('company_id')
            ->constrained('companies')
            ->cascadeOnDelete();
        $table->foreignId('network_id')
            ->constrained('networks')
            ->cascadeOnDelete();
        $table->primary(['company_id', 'network_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('company_networks');

    Schema::table('companies', function (Blueprint $table) {
        $table->dropColumn([
            'timezone', 'logo_path', 'login_attempts', 'is_2fa_enforced',
            'is_demo', 'is_active_zone',
            'custom_alarm_threshold', 'custom_alarm_threshold_unit',
        ]);
    });
}
```

**Migration ordering note:** This migration must run after:
- `0001_01_01_000000_create_companies_table.php`
- `0001_01_01_000008_create_networks_table.php` (networks must exist for the FK)

---

## Complete Companies Table (After Both Migrations)

```
companies
├── id
├── name                          string
├── code                          string(20), unique
├── address                       text, nullable
├── contact_email                 string, nullable
├── contact_phone                 string(30), nullable
├── timezone                      string(100), default 'UTC'
├── logo_path                     string, nullable
├── login_attempts                unsignedTinyInt, default 5
├── is_2fa_enforced               boolean, default false
├── is_demo                       boolean, default false
├── is_active_zone                boolean, default true
├── is_active                     boolean, default true
├── custom_alarm_threshold        unsignedSmallInt, nullable
├── custom_alarm_threshold_unit   string(10), nullable
└── timestamps
```

---

## Existing Pivots (Already in DB — No Changes)

| Migration file | Pivot | Status |
|----------------|-------|--------|
| `0001_01_01_000006` | `role_companies` | ✅ Exists, no changes |
| `0001_01_01_000009` | `role_networks` | ✅ Exists, no changes |
| `0001_01_01_000008` | `network_node_types` | ✅ Exists (in networks migration), no changes |

`company_networks` is **new** — created by the migration above.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/companies | sanctum + superadmin | List companies (paginated) |
| GET | /api/v1/companies/{id} | sanctum + superadmin or own company admin | Single company |
| POST | /api/v1/companies | sanctum + superadmin | Create company |
| PUT | /api/v1/companies/{id} | sanctum + superadmin or own company admin | Update company |
| DELETE | /api/v1/companies/{id} | sanctum + superadmin | Delete company |
| GET | /api/v1/companies/options | sanctum | Flat list for dropdowns — all auth users |
| POST | /api/v1/companies/{id}/logo | sanctum + superadmin or own company admin | Upload logo |

**Notes:**
- `GET /companies/options` route must be registered **before** `apiResource` to avoid Laravel matching `options` as an `{id}` parameter.
- `role_companies` and `role_networks` are managed by the **Role module**, not here.

---

## GET /api/v1/companies/options

Accessible to all authenticated users. Used by the User create/edit form to pick a company.

**Scoping:**
- Superadmin: all active companies
- Company admin: their own company only

```json
{
  "data": [
    { "id": 1, "name": "Acme Corp", "code": "ACME" },
    { "id": 2, "name": "Globex",    "code": "GLOBEX" }
  ]
}
```

---

## Pagination (GET /api/v1/companies)

Superadmin only. Accepts `?page` and `?per_page` (1–100, default 15).

| Query param | Type | Description |
|-------------|------|-------------|
| `search` | string | Full-text on `name`, `code` |
| `is_active` | 0 \| 1 | Filter by active status |
| `is_demo` | 0 \| 1 | Filter by demo flag |

---

## API Response Shape (CompanyResource)

The API must produce exactly this shape. The frontend must consume exactly this shape.

```json
{
  "id": 1,
  "code": "ACME",
  "name": "Acme Corp",
  "address": "123 Main St",
  "contact_email": "admin@acme.com",
  "contact_phone": "+65 1234 5678",
  "timezone": "Asia/Singapore",
  "logo_url": "https://example.com/storage/logos/acme.png",
  "login_attempts": 5,
  "is_2fa_enforced": false,
  "is_demo": false,
  "is_active_zone": true,
  "is_active": true,
  "custom_alarm_threshold": 10,
  "custom_alarm_threshold_unit": "minutes",
  "networks": [
    { "id": 1, "name": "Building A", "network_address": "0xA1B2C3" },
    { "id": 2, "name": "Building B", "network_address": "0xD4E5F6" }
  ],
  "networks_count": 2,
  "users_count": 14,
  "created_at": "2026-01-01T00:00:00+00:00",
  "updated_at": "2026-01-01T00:00:00+00:00"
}
```

**Field notes:**
- `logo_url` — signed/public URL generated server-side from `logo_path`. `null` if no logo.
- `logo_path` — **never exposed** in the response. Internal storage key only.
- `custom_alarm_threshold` + `custom_alarm_threshold_unit` — both `null` = use each network's own threshold.
- `networks` — networks assigned to this company via `company_networks` pivot.
- `networks_count` — convenience count, equals `networks.length`.
- `users_count` — count of non-deleted users in this company.

---

## Request Payloads

### POST /api/v1/companies

```json
{
  "name": "string",
  "code": "string",
  "address": "string | null",
  "contact_email": "string | null",
  "contact_phone": "string | null",
  "timezone": "string",
  "login_attempts": 5,
  "is_2fa_enforced": false,
  "is_demo": false,
  "is_active_zone": true,
  "is_active": true,
  "custom_alarm_threshold": 10,
  "custom_alarm_threshold_unit": "minutes",
  "network_ids": [1, 2, 3]
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `name` | required, string, max:255 |
| `code` | required, string, max:20, unique:companies, regex:`/^[A-Z0-9_-]+$/` |
| `address` | optional, nullable text |
| `contact_email` | optional, nullable, email format |
| `contact_phone` | optional, nullable, string, max:30 |
| `timezone` | required, string, must be valid PHP timezone (`timezone_identifiers_list()`) |
| `login_attempts` | optional, integer, min:1, max:10, default 5 |
| `is_2fa_enforced` | optional, boolean, default false |
| `is_demo` | optional, boolean, default false |
| `is_active_zone` | optional, boolean, default true |
| `is_active` | optional, boolean, default true |
| `custom_alarm_threshold` | optional, nullable integer, min:1; `required_with:custom_alarm_threshold_unit` |
| `custom_alarm_threshold_unit` | optional, nullable, in:`[minutes,hours]`; `required_with:custom_alarm_threshold` |
| `network_ids` | optional, array; each item must `exist:networks,id` |

Logo is uploaded separately via `POST /companies/{id}/logo` — not part of this payload.

### PUT /api/v1/companies/{id}

Same fields as POST, all optional. Same validation rules apply when present.

**`code` is prohibited** on PUT (immutable after creation). API returns `422` if sent.

**Company admin restrictions** — non-superadmin callers receive `422` (`prohibited`) if they send:
- `code`, `is_demo`, `is_active`, `is_active_zone`
- `custom_alarm_threshold`, `custom_alarm_threshold_unit`
- `network_ids`

Company admin may only send: `name`, `address`, `contact_email`, `contact_phone`, `timezone`, `login_attempts`, `is_2fa_enforced`.

### POST /api/v1/companies/{id}/logo

Multipart form upload.

```
Content-Type: multipart/form-data
logo: <file>
```

- `logo`: required, file, mimes:`jpg,jpeg,png,webp`, max:2048 KB
- Old logo is deleted from storage before new one is saved
- Returns updated `CompanyResource`

---

## Permission Keys for this Module

| Permission key | Enforced in | Purpose |
|----------------|-------------|---------|
| `company.view` | `CompanyController@index`, `@show` | List and view companies |
| `company.create` | `StoreCompanyRequest::authorize()` | Create — superadmin only in practice |
| `company.update` | `UpdateCompanyRequest::authorize()` | Update — superadmin or own company admin |
| `company.delete` | `CompanyController@destroy` | Delete — superadmin only in practice |
| `company.upload_logo` | `UploadCompanyLogoController` | Upload logo |

**Scoping notes:**
- Superadmin bypasses all checks and sees all companies.
- Company admin with `company.update` can only PUT their own company, and only the allowed fields.
- `company.create` and `company.delete` are never assigned to company admin roles.

---

## Business Rules

1. **Superadmin-only for create and delete.** These permission keys are never assigned to company admin roles.
2. **Company admin self-edit scoping.** On `PUT /companies/{id}`, non-superadmin users: (a) must have `company.update`, (b) can only act when `{id}` matches their own `company_id`. API enforces in `authorize()`.
3. **Company admin field restrictions.** Non-superadmin callers receive `422` (`prohibited`) for `code`, `is_demo`, `is_active`, `is_active_zone`, `custom_alarm_threshold`, `custom_alarm_threshold_unit`, `network_ids`.
4. **`code` is immutable after creation.** `prohibited` rule on `PUT`. Frontend hides the code field in edit mode.
5. **Company cannot be deleted** if it has active users. API returns `409 Conflict: { message: "Company has active users and cannot be deleted." }`.
6. **`network_ids` is replace-all on update.** Sending `[]` removes all company networks. Omitting `network_ids` entirely leaves existing company networks unchanged.
7. **`custom_alarm_threshold` and `custom_alarm_threshold_unit` must be set together.** Both present or both null — the `required_with` rule enforces this.
8. **Logo replacement deletes the old file.** When a new logo is uploaded, the old `logo_path` is deleted from storage first.
9. **`is_active = false` prevents login** for all users in that company (enforced at the auth layer).
10. **Timezone must be a valid PHP timezone identifier** from `timezone_identifiers_list()`.
11. **`role_networks` constraint.** When assigning networks to a role (Role module), the API must verify that each `network_id` exists in `company_networks` for that role's company. This is enforced in the Role module, not here — but the constraint is documented here because the data lives in `company_networks`.

---

## Frontend UI Notes

### Companies List Page (Superadmin only)

- Route: `/companies` (lazy loaded, `canViewCompanies()` guard)
- Layout: `DashboardLayout`
- **Uses `DataTableServer`** — no custom table, wrap in `<div className="overflow-x-auto">`
- Table columns: Code (monospace badge) | Name | Timezone | Networks (count badge) | Users (count badge) | Active (green/red badge) | Demo (yellow badge — only when `is_demo=true`) | Actions
- Filters: Search input (debounced) | Active toggle | Demo toggle — all local state, passed to `useCompanies()` params
- Create button → `CompanyFormDialog` (create mode) — only when `canCreateCompany()`
- Edit button → `CompanyFormDialog` (edit mode) — only when `canUpdateCompany()`
- Delete button → confirm dialog → disabled + tooltip when company has users — only when `canDeleteCompany()`
- Logo upload → icon button in Actions column → `uploadCompanyLogo()`

### Company Self-Edit Page (Company admin only)

- Route: `/settings/company`
- Layout: `DashboardLayout`
- Full settings page — not a dialog
- Shows only the fields a company admin can edit:
  - Company Name, Address, Contact Email, Contact Phone
  - Timezone (searchable Select)
  - Login Attempts (number input, 1–10)
  - 2FA Enforced (Switch)
  - Company Logo (file input with current logo preview)
- Does **not** show: Code, Is Demo, Is Active, Is Active Zone, Custom Alarm, Networks
- Submit shows spinner + disabled while saving

### CompanyFormDialog (Superadmin create/edit)

Mandatory responsive structure per AGENTS.md:
```tsx
<DialogContent className="w-full max-w-2xl max-h-[90vh] flex flex-col gap-0">
  <DialogHeader className="px-6 pt-6 pb-4 shrink-0">...</DialogHeader>
  <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-6">
    {/* sections */}
  </div>
  <DialogFooter className="px-6 py-4 shrink-0 border-t">...</DialogFooter>
</DialogContent>
```

**Section 1 — Identity:**
- Code (Input) — hidden/disabled in edit mode. Regex `/^[A-Z0-9_-]+$/i`, converted to uppercase on blur.
- Name (Input)
- `grid grid-cols-1 sm:grid-cols-2 gap-4` for Code + Name
- Address (Textarea, full width)
- Contact Email + Contact Phone: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Timezone (searchable combobox, full width)

**Section 2 — Security:**
- `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Login Attempts (number Input, 1–10)
- 2FA Enforced (Switch)

**Section 3 — Flags (superadmin only — do not render for non-superadmin):**
- `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Is Demo (Switch) | Is Active Zone (Switch) | Is Active (Switch)

**Section 4 — Alarm Override (superadmin only):**
- Custom Alarm Threshold (number Input, nullable) + Unit Select (`flex gap-2 items-end`)
- Unit options from `ALARM_THRESHOLD_UNIT_OPTIONS`
- Helper text: "Leave blank to use each network's own threshold"

**Section 5 — Networks (superadmin only):**
- Fetched via `useNetworkOptions()` from `GET /api/v1/networks/options`
- Multi-select checkbox group: `max-h-48 overflow-y-auto border rounded-md p-2`
- Each option: checkbox + network name + `network_address` monospace badge

Logo is NOT in this dialog — it is a separate upload action.

### Scoping & Visibility

- `/companies`: superadmin only → sidebar link gated by `canViewCompanies()`
- `/settings/company`: company admin only → sidebar link shown only to non-superadmin with `company.update`
- Superadmin never sees the `/settings/company` link

---

## TypeScript Types (`src/types/company.ts`)

```ts
// src/types/company.ts

export type AlarmThresholdUnit = 'minutes' | 'hours';

export interface CompanyNetwork {
  id: number;
  name: string;
  network_address: string;
}

export interface Company {
  id: number;
  code: string;
  name: string;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  timezone: string;
  logo_url: string | null;
  login_attempts: number;
  is_2fa_enforced: boolean;
  is_demo: boolean;
  is_active_zone: boolean;
  is_active: boolean;
  custom_alarm_threshold: number | null;
  custom_alarm_threshold_unit: AlarmThresholdUnit | null;
  networks: CompanyNetwork[];
  networks_count: number;
  users_count: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyListResponse {
  data: Company[];
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

export interface CompanyOption {
  id: number;
  name: string;
  code: string;
}

export interface StoreCompanyPayload {
  name: string;
  code: string;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  timezone: string;
  login_attempts?: number;
  is_2fa_enforced?: boolean;
  is_demo?: boolean;
  is_active_zone?: boolean;
  is_active?: boolean;
  custom_alarm_threshold?: number | null;
  custom_alarm_threshold_unit?: AlarmThresholdUnit | null;
  network_ids?: number[];
}

// Full update — superadmin
export interface UpdateCompanyPayload extends Partial<Omit<StoreCompanyPayload, 'code'>> {}

// Restricted update — company admin only (enforced API-side too)
export interface UpdateOwnCompanyPayload {
  name?: string;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  timezone?: string;
  login_attempts?: number;
  is_2fa_enforced?: boolean;
}
```

---

## API File (`src/api/companies.ts`)

```ts
// src/api/companies.ts
// API functions for Company module endpoints

import axiosClient from './axiosClient';
import type {
  Company,
  CompanyListResponse,
  CompanyOption,
  StoreCompanyPayload,
  UpdateCompanyPayload,
  UpdateOwnCompanyPayload,
} from '@/types/company';

export const getCompanies = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: 0 | 1;
  is_demo?: 0 | 1;
}): Promise<CompanyListResponse> => {
  const res = await axiosClient.get('/v1/companies', { params });
  return res.data;
};

export const getCompanyOptions = async (): Promise<{ data: CompanyOption[] }> => {
  const res = await axiosClient.get('/v1/companies/options');
  return res.data;
};

export const getCompany = async (id: number): Promise<{ data: Company }> => {
  const res = await axiosClient.get(`/v1/companies/${id}`);
  return res.data;
};

export const createCompany = async (
  payload: StoreCompanyPayload
): Promise<{ data: Company }> => {
  const res = await axiosClient.post('/v1/companies', payload);
  return res.data;
};

export const updateCompany = async (
  id: number,
  payload: UpdateCompanyPayload | UpdateOwnCompanyPayload
): Promise<{ data: Company }> => {
  const res = await axiosClient.put(`/v1/companies/${id}`, payload);
  return res.data;
};

export const deleteCompany = async (id: number): Promise<void> => {
  await axiosClient.delete(`/v1/companies/${id}`);
};

export const uploadCompanyLogo = async (
  id: number,
  file: File
): Promise<{ data: Company }> => {
  const form = new FormData();
  form.append('logo', file);
  const res = await axiosClient.post(`/v1/companies/${id}/logo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
```

---

## Checklist Before Implementation

### API
- [ ] New migration: `add_fields_to_companies_and_create_company_networks` (alter + new pivot)
- [ ] Migration timestamp places it after `0001_01_01_000008` (networks must exist for FK)
- [ ] `role_networks` — already exists (`0001_01_01_000009`) — no changes needed
- [ ] `role_companies` — already exists (`0001_01_01_000006`) — no changes needed
- [ ] `CompanyResource` shape matches contract exactly — `logo_url` from `Storage::url()`, never raw `logo_path`
- [ ] `StoreCompanyRequest::authorize()` — `is_superadmin` only
- [ ] `UpdateCompanyRequest::authorize()` — superadmin OR (has `company.update` AND own company)
- [ ] `UpdateCompanyRequest::rules()` — `code` is `prohibited`; restricted fields are `prohibited` for non-superadmin
- [ ] `network_ids` replace-all — `sync()` when present; skip pivot when omitted
- [ ] `custom_alarm_threshold` + unit pair validation (`required_with`)
- [ ] `UploadCompanyLogoController` — deletes old `logo_path` before saving new one
- [ ] `destroy` — check `users` table FK; return `409` if users exist
- [ ] `/options` route registered **before** `apiResource`
- [ ] PermissionSeeder updated: `company.view`, `company.create`, `company.update`, `company.delete`, `company.upload_logo`
- [ ] Routes registered for all 7 endpoints
- [ ] Feature tests — full coverage per checklist section in prompts

### Frontend
- [ ] `src/types/company.ts` — all interfaces
- [ ] `src/api/companies.ts` — all functions
- [ ] `src/hooks/useCompanyPermissions.ts` — `canView/Create/Update/Delete/UploadLogo` helpers
- [ ] `src/hooks/useCompanies.ts` — `useCompanies()` and `useCompanyOptions()`
- [ ] `src/pages/companies/CompaniesPage.tsx` — `DataTableServer`, correct columns, filters
- [ ] `src/pages/settings/CompanySettingsPage.tsx` — company admin self-edit, allowed fields only
- [ ] `src/components/shared/CompanyFormDialog.tsx` — responsive, 5 sections, superadmin-only sections gated
- [ ] Routes added to `AppRouter.tsx` (lazy loaded)
- [ ] Sidebar: superadmin → Companies link; company admin → Company Settings link
- [ ] Code field hidden in edit mode
- [ ] Sections 3, 4, 5 not rendered for non-superadmin
- [ ] Network multi-select uses `useNetworkOptions()` (not `useCompanyOptions()`)
- [ ] Delete button disabled + tooltip when company has users
- [ ] Submit buttons: spinner + disabled while in-flight
- [ ] All strings in `src/constants/strings.ts`
- [ ] Dark mode variants on all custom styles
- [ ] `DataTableServer` + `overflow-x-auto` on list page
- [ ] Responsive dialog structure per AGENTS.md

---

## Open Questions

- [ ] Should `is_active = false` immediately terminate existing sessions for that company's users, or only prevent new logins? Confirm with backend team.
- [ ] Timezone dropdown: all ~600 PHP timezone identifiers or a curated short list? Recommend searchable combobox with full list.
- [ ] Logo disk: `public` or `s3`? Which env uses which? Document in `.env.example` as `FILESYSTEM_DISK=public`.
- [ ] Is `code` shown to end users in the dashboard UI, or is it internal only?