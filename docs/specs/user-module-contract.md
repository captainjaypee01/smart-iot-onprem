# User Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Auth mechanism
- Cookie-based Sanctum (ADR-001)
- axiosClient uses `withCredentials: true`
- No Authorization header, no token in Zustand
- CSRF: `GET /sanctum/csrf-cookie` before first mutation

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/companies/options | sanctum | List companies for user-create dropdown (simple list, **not paginated**) |
| GET | /api/v1/roles/options | sanctum | List roles for a company (dropdown for user create/edit; **not paginated**) |
| GET | /api/v1/users | sanctum | List users (paginated) |
| GET | /api/v1/users/{id} | sanctum | Single user |
| POST | /api/v1/users | sanctum | Create + send invite |
| PUT | /api/v1/users/{id} | sanctum | Update user |
| DELETE | /api/v1/users/{id} | sanctum | Soft delete |
| POST | /api/v1/users/{id}/resend-invite | sanctum | Resend invite |
| POST | /api/v1/users/{id}/disable | sanctum | Toggle is_active |

**Note:** `GET /api/v1/companies` and `GET /api/v1/roles` are **reserved** for future Company and Role modules (paginated index). Use `/companies/options` and `/roles/options` for dropdown/lookup data so the response shape never changes when those modules are added.

---

## GET /api/v1/companies/options

Returns companies for selection when creating a user. **Simple list, no pagination.** When a full Company module exists, `GET /api/v1/companies` may return a paginated index; this endpoint stays as-is.

**Scoping**
- **Superadmin:** sees all active companies.
- **Company admin:** sees only their own company (matches other scoping rules).

**Response**
```json
{
  "data": [
    { "id": 1, "name": "Acme Corp", "code": "ACME" },
    { "id": 2, "name": "Globex", "code": "GLOBEX" }
  ]
}
```

---

## GET /api/v1/roles/options

Returns roles scoped to a company for the role dropdown when creating or editing a user. **Simple list, no pagination.** When a full Role module exists, `GET /api/v1/roles` may return a paginated index; this endpoint stays as-is.

**Query**
- `?company_id=1` — **required** for superadmin; **ignored** for company admin (uses auth user’s company).

**Scoping**
- **Company admin:** always returns roles for their own `company_id`; ignores `?company_id`.
- **Superadmin:** must pass `?company_id`; returns roles for that company.
- A role appears only if it exists in `role_companies` for that company.

**Response**
```json
{
  "data": [
    { "id": 1, "name": "Operator", "is_system_role": false },
    { "id": 2, "name": "Viewer", "is_system_role": false }
  ]
}
```

---

## API Response Shape (UserResource)

The API must produce exactly this shape. The frontend must consume exactly this shape.

**Never expose:** password, remember_token, access_token, refresh_token.

```json
{
  "id": 1,
  "uuid": "uuid-string",
  "first_name": "string",
  "last_name": "string",
  "name": "string",
  "email": "string",
  "username": "string | null",
  "is_superadmin": false,
  "is_active": true,
  "status": "active",
  "company": { "id": 1, "name": "Acme Corp", "code": "ACME" },
  "role": { "id": 1, "name": "Operator" },
  "last_login_at": "2026-01-01T00:00:00+00:00",
  "created_at": "2026-01-01T00:00:00+00:00"
}
```

Dates are ISO8601. `last_login_at` may be `null`.

---

## Request payloads

### POST /api/v1/users
**Default (invite flow):** omit `use_invite` or send `use_invite: true`. User is created with no password; invite token is stored and `WelcomeUserNotification` is sent.

**Superadmin-only (create with password):** send `use_invite: false` and `password`. User is created with hashed password and `email_verified_at` set; no invite token or email. Non-superadmin callers get 403.

```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "username": "string | null",
  "company_id": 1,
  "role_id": 1,
  "use_invite": true,
  "password": "string (required when use_invite is false, min 8 chars)"
}
```
- `use_invite`: optional, boolean; default `true`. When `false`, `password` is required and only superadmin may use it.
- **Validation:** `role_id` must exist in `role_companies` for the given `company_id` (not only in `roles`).

### PUT /api/v1/users/{id}
```json
{
  "first_name": "string?",
  "last_name": "string?",
  "email": "string?",
  "username": "string?",
  "role_id": "number?",
  "company_id": "number?",
  "status": "active | locked | disabled"
}
```
**Validation:**
- `role_id` (when present) must exist in `role_companies` for the user’s company.
- `company_id` and `status` can only be changed by superadmin; company admins are forbidden from sending these fields.

---

## Pagination (GET /api/v1/users)

Laravel paginated response:
```json
{
  "data": [UserResource, ...],
  "meta": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 42 },
  "links": { "first": "...", "next": "...", "prev": null, "last": "..." }
}
```

---

## Business rules (both sides)

- **is_superadmin = true** → cannot be deleted or disabled (API returns 403; frontend hides the button).
- **User cannot act on themselves** (API enforces; frontend hides button).
- **resend-invite** only valid when `last_login_at` is null (never logged in).
- **Company admin** scoped to own `company_id` — API enforces; frontend shows no cross-company UI.
- **Create with password** (`use_invite: false` + `password`) — superadmin only; API returns 403 for non-superadmin.
