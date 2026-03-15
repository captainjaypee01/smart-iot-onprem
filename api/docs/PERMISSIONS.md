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
