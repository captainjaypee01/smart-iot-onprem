# Permission Keys and Enforcement

This document lists **permission keys** used in the API and where they are enforced. Use it to keep API and frontend (and any future Gate/Policy usage) in sync.

## User module

| Permission key | Enforced in | Purpose |
|----------------|-------------|---------|
| `user.view` | `UserController@index`, `UserController@show` | List users (paginated) and view a single user |
| `user.create` | `StoreUserRequest::authorize()` | Create/invite user (`POST /api/v1/users`) |
| `user.update` | `UpdateUserRequest::authorize()` | Update user (`PUT /api/v1/users/{id}`) |
| `user.delete` | `UserController@destroy` | Soft-delete user |
| `user.disable` | `DisableUserController::__invoke` | Toggle user active/disabled (`POST .../disable`) |
| `user.resend_invite` | `ResendInviteController::__invoke` | Resend welcome/set-password email |
| `user.change_status` | `UpdateUserRequest::rules()` (superadmin may send `status`) | Change user status (active/locked/disabled) — superadmin only |
| `user.change_company` | `UpdateUserRequest::rules()` (superadmin may send `company_id`) | Reassign user to another company — superadmin only |

**Notes:**

- **Superadmin** bypasses permission checks and company scope. For update, only superadmin may send `company_id` or `status`; for others these fields are `prohibited`.
- **Company admin** may only act on users in their own company (enforced in authorize/controller in addition to the permission check).
- Permissions are seeded in `PermissionSeeder` and assigned to roles via `role_permissions`. The `User` model’s `hasPermission($key)` checks the authenticated user’s role.

## Pattern for new modules

1. **Add keys** in `PermissionSeeder` (e.g. `resource.view`, `resource.create`, `resource.update`, `resource.delete`).
2. **FormRequest (create/update):** In `authorize()`, check the relevant permission first (`hasPermission('resource.create')` etc.), then apply scope/superadmin logic.
3. **Controller (index, show, destroy, or one-off actions):** At the start of the method, check the permission; return 403 if missing. Then apply scope (e.g. company) as needed.
4. **Optional:** Define Laravel Gates that delegate to `$user->hasPermission(...)` so you can use `Gate::authorize('user.update')` or `$this->authorize('user.update')` for consistency.

## Shared contract

User request/response shapes and business rules are defined in the repo root **[docs/specs/user-module-contract.md](../../docs/specs/user-module-contract.md)** (relative to `api/docs/`). Keep that file in sync when changing user endpoints or adding permissions that affect the contract.

---

## Permission key lifecycle & rename playbook

Permission **keys** (e.g. `user.view`, `permission.update`) are treated as **stable identifiers**, similar to API routes or DB column names:

- Backend checks are hardcoded against keys (e.g. `$user->hasPermission('user.view')`).
- Frontend gates use the same string keys (e.g. `usePermission().hasPermission("user.view")`, nav config, role UIs).
- The `permissions.module` field is a **grouping hint** (for seeding and UI), not the primary identifier.

Because of that:

- **Keys are immutable at runtime**: the Permission module API and UI do **not** allow editing `key` or `module` after creation.
- Only `display_name` and `description` are editable via the Permission CRUD screen.

### If you typo a permission key (early)

If a key was just created and is **not yet used in code**:

1. **Delete the bad key** via the Permission CRUD UI (or directly from `permissions` if still in local dev).
2. **Create a new permission** with the correct `key` and `module`.
3. Update `PermissionSeeder` to use only the correct key so future seeds are clean.

This is the simplest and safest approach when the mistake is caught before it’s wired into controllers/hooks.

### If the key is already used in code (backend or frontend)

Treat it like a small, versioned refactor:

1. **Update code first**:
   - Change all usages of the old key in PHP (`hasPermission('old.key')`) and TS/JS (`"old.key"`) to the new key.
   - Update `PermissionSeeder` to seed the new key.
2. **Migrate data**:
   - Add a one-off migration or artisan command that:
     - Inserts the new permission row if it doesn’t exist.
     - Copies `role_permissions` assignments from the old permission ID to the new permission ID.
     - Optionally soft-deletes or flags the old permission as deprecated.
3. **Deploy and verify**:
   - Run tests.
   - Check that roles still have the intended abilities under the new key.
4. **Clean up**:
   - Remove any remaining references to the old key from seeders or docs.

This avoids a state where the UI shows one key but code still checks another.

### Why we don’t support UI-based key renames

Allowing arbitrary key renames from the UI would:

- Break backend checks that still use the old key.
- Break frontend gates and nav config until the code is updated.
- Make it harder to reason about which roles truly have which abilities over time.

For that reason, **key renames should always be intentional, code-driven changes** (code + migration), not ad‑hoc edits from the admin UI.
