# Smart IoT On-Prem API

Laravel API service for the Smart IoT On-Prem product.

## Quick Start

### Prerequisites

- PHP 8.4+
- Composer
- PostgreSQL (via Docker Compose)
- Redis (via Docker Compose)

### Installation

1. **Install dependencies:**
   ```bash
   composer install
   ```

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Generate application key:**
   ```bash
   php artisan key:generate
   ```

4. **Run migrations:**
   ```bash
   php artisan migrate
   ```

5. **Start services (via Docker Compose from project root):**
   ```bash
   docker compose up -d
   ```

## Development

### Running Tests

```bash
composer test
# or
php artisan test
```

### Code Style

```bash
composer pint
```

### Static Analysis

```bash
composer analyse
```

## API Endpoints

### Public API (SPA)

Base URL: `/api/v1`. Auth is **cookie-based Sanctum** (see [docs/DECISIONS.md](docs/DECISIONS.md) ADR-001). All protected routes require the session cookie; no Bearer token in the SPA.

#### Auth
- `POST /api/v1/auth/login` — Email + password login (sets session cookie)
- `POST /api/v1/auth/logout` — Logout (requires auth)
- `GET  /api/v1/auth/me` — Returns authenticated user (requires auth)
- `POST /api/v1/auth/set-password` — Sets password from invite link token
- `GET  /api/v1/auth/microsoft/redirect` — Returns Microsoft OAuth redirect URL for SPA

#### Microsoft SSO Callback (Web Route — not API)
- `GET  /auth/microsoft/callback` — Handles Microsoft OAuth callback, redirects to frontend

#### Lookup / options (for dropdowns; not paginated)
- `GET /api/v1/companies/options` — List companies (superadmin: all; company admin: own). Use for user create/edit company select.
- `GET /api/v1/roles/options?company_id={id}` — List roles for a company. Superadmin must pass `company_id`; company admin’s company is used automatically.

**Note:** `GET /api/v1/companies` and `GET /api/v1/roles` are **reserved** for future paginated Company/Role modules. Use the `/options` endpoints for dropdown data so the response shape stays stable.

#### Users (requires auth; permissions apply — see [docs/API_GUIDELINES.md](docs/API_GUIDELINES.md#permissions-and-authorization))
- `GET    /api/v1/users` — List users (paginated). Query: `?page=1&per_page=15` (per_page 1–100). Requires `user.view`.
- `GET    /api/v1/users/{user}` — Single user. Requires `user.view`.
- `POST   /api/v1/users` — Create user (invite flow or, superadmin-only, with password). Requires `user.create`.
- `PUT    /api/v1/users/{user}` — Update user (name, email, username, role; superadmin may also send `company_id`, `status`). Requires `user.update`.
- `DELETE /api/v1/users/{user}` — Soft delete. Requires `user.delete`.
- `POST   /api/v1/users/{user}/resend-invite` — Resend invite (only when user has never logged in). Requires `user.resend_invite`.
- `POST   /api/v1/users/{user}/disable` — Toggle active/disabled. Requires `user.disable`.

#### Settings (requires auth; per-company)
- `GET   /api/v1/settings/session` — Get session duration for a company. Superadmin: optional `?company_id=` and response includes `companies` list; company admin gets their own company only.
- `PATCH /api/v1/settings/session` — Update session duration for a company. Body: `session_lifetime_minutes` (required), `company_id` (required for superadmin). New logins for that company use this value.

#### Commands (requires auth)
- `POST /api/v1/commands` — Create command

### Internal API (Backend Services)

Base URL: `/internal`

Requires `X-Internal-Token` header.

- `POST /internal/commands/{id}/mark-dispatched` — Mark command as dispatched
- `POST /internal/commands/{id}/mark-acked` — Mark command as acked
- `POST /internal/commands/{id}/mark-completed` — Mark command as completed
- `POST /internal/commands/{id}/mark-failed` — Mark command as failed

## Authentication Model

This API uses **cookie-based Sanctum** for the SPA (see ADR-001 in [docs/DECISIONS.md](docs/DECISIONS.md)).

### 1. SPA session (cookies)
- The React frontend uses **httpOnly session cookies**; no token in the SPA.
- SPA sends credentials with `withCredentials: true` and obtains a CSRF cookie via `GET /sanctum/csrf-cookie` before mutations.
- Protected routes are authorized via the session; no `Authorization: Bearer` header.

### 2. Microsoft SSO flow
1. SPA calls `GET /api/v1/auth/microsoft/redirect` → receives `{ redirect_url }`
2. SPA sets `window.location.href = redirect_url`
3. User authenticates with Microsoft
4. Microsoft redirects to `GET /auth/microsoft/callback` (web route, not API)
5. Laravel matches the Microsoft email to an existing user (no auto-registration)
6. Laravel sets the session cookie and redirects to `{FRONTEND_URL}/auth/callback` (and optionally passes user data)
7. SPA loads session (e.g. via `GET /api/v1/auth/me`) and navigates to dashboard

### 3. User invite flow
Admins create users via `POST /api/v1/users`. The system:
1. Creates the user with `password = null` (or, superadmin-only with `use_invite: false` and a password)
2. Stores an invite token in `password_reset_tokens` and sends `WelcomeUserNotification` (unless creating with password)
3. User sets their password via the link in the email → `POST /api/v1/auth/set-password`

> **Key rule**: Users are never auto-created from SSO. An admin must create the user first.

## Permissions (User module)

Sensitive user actions are gated by **permission keys** (see `permissions` table and `PermissionSeeder`). Enforcement:

- **FormRequest `authorize()`** — Create/update: check `user.create` / `user.update` in `StoreUserRequest` and `UpdateUserRequest`.
- **Controllers** — List/show use `user.view`; delete uses `user.delete`; resend-invite uses `user.resend_invite`; disable uses `user.disable`. Superadmin bypasses permission checks; company admins are still scoped to their company.

Full list and patterns: [docs/API_GUIDELINES.md#permissions-and-authorization](docs/API_GUIDELINES.md#permissions-and-authorization) and [docs/PERMISSIONS.md](docs/PERMISSIONS.md).

## Architecture

See [docs/API_GUIDELINES.md](docs/API_GUIDELINES.md) for detailed architecture and coding standards.

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for security guidelines and configuration.

## Architecture Decisions

See [docs/DECISIONS.md](docs/DECISIONS.md) for ADRs (Architecture Decision Records).

## Project Structure

```
app/
├── Actions/              # Business logic (use cases)
│   ├── Commands/         # Command-related actions
│   ├── Users/            # StoreUserAction, UpdateUserAction, DeleteUserAction, DisableUserAction
│   └── Auth/             # Authentication actions
├── Contracts/            # Interfaces for dependency injection
├── Console/              # Artisan commands
│   └── Commands/         # Custom commands (e.g., outbox:publish)
├── DTO/                  # Data Transfer Objects
│   ├── Commands/         # Command-related DTOs
│   └── Users/            # StoreUserDTO, UpdateUserDTO
├── Enums/                # Type-safe enumerations
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/       # Public API controllers (SPA)
│   │   │   ├── Auth/     # Login, Logout, Me, MicrosoftRedirect, SetPassword
│   │   │   ├── Companies/  # IndexCompaniesController (GET /companies/options)
│   │   │   ├── Roles/      # IndexRolesController (GET /roles/options)
│   │   │   ├── Users/      # UserController, ResendInviteController, DisableUserController
│   │   │   └── Settings/   # SessionSettingsController
│   │   ├── Auth/         # MicrosoftCallbackController (web route, not API)
│   │   └── Internal/     # Internal API controllers (backend services)
│   ├── Requests/
│   │   └── Api/V1/       # FormRequest validation (e.g. Users/StoreUserRequest, UpdateUserRequest)
│   └── Resources/
│       └── Api/V1/       # UserResource, etc.
├── Models/               # Eloquent models (User, Company, Role, Permission, …)
├── Notifications/        # WelcomeUserNotification (invite email)
└── Services/             # Service classes (e.g., OutboxPublisherService)

routes/
├── api.php               # Public API routes (/api/v1/*)
├── web.php               # Microsoft OAuth callback route (/auth/microsoft/callback)
└── internal.php          # Internal API routes (/internal/*)
```

**Shared contract (API ↔ frontend):** User module request/response shapes and business rules are documented in the repo root [docs/specs/user-module-contract.md](../docs/specs/user-module-contract.md). Keep that file in sync when changing user endpoints or resources.

## Which .env file is used (Docker)

When you run the API via Docker Compose from the **repo root**, the API container’s env is determined by the compose file(s) you use:

| How you start the stack | Env file loaded by the API container |
|-------------------------|--------------------------------------|
| `docker compose up -d` (base only) | `api/.env` |
| `docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d` | `api/.env.dev` |
| UAT override + `--env-file .env.uat` | `api/.env.uat` |
| Prod override + `--env-file .env.prod` | `api/.env.prod` |

So in the `api/` folder you may have both `.env` and `.env.dev`: **`.env`** is used when no override is applied (base compose); **`.env.dev`** is used when you use the dev override. Ensure the file that matches your run has the correct `REDIS_PASSWORD`, `SESSION_DRIVER`, and `REDIS_HOST` (e.g. `redis` in Docker). See the repo root [docs/ENV_FILES.md](../docs/ENV_FILES.md) for the full picture.

**Verify the API is using Redis:** Call `GET /api/v1/health`. The response includes `session_driver` and `redis_session_connected`. When Redis is used correctly you should see `"session_driver": "redis"` and `"redis_session_connected": true`.

## Environment Variables

Key variables (see `env.example` for full list):

- `APP_URL` — API base URL
- `FRONTEND_URL` — React SPA URL (used for OAuth redirects and invite email links)
- `SANCTUM_STATEFUL_DOMAINS` — Domains allowed for Sanctum stateful auth
- `INTERNAL_API_TOKEN` — Token for internal API endpoints
- `MICROSOFT_CLIENT_ID` — Azure App Registration client ID
- `MICROSOFT_CLIENT_SECRET` — Azure App Registration client secret
- `MICROSOFT_REDIRECT_URI` — Must exactly match the URI registered in Azure Portal
- `MICROSOFT_TENANT_ID` — Azure tenant (`organizations`, `common`, or specific tenant ID)
- `DB_*` — Database configuration
- `REDIS_*` — Redis configuration
- `SESSION_SECURE_COOKIE` — Set to `true` in production (HTTPS required)
- `SESSION_DRIVER` — Use `redis` (recommended; see `.env.example`) for fast session reads. Use `database` or `file` if Redis is not available.
- `SESSION_CONNECTION` — When `SESSION_DRIVER=redis`, set to `session` to use the dedicated Redis DB (see `config/database.php`).
- `REDIS_SESSION_DB` — Redis database number for sessions (default `2`), separate from default (`0`) and cache (`1`).
- `SESSION_LIFETIME` — How long (in **minutes**) the session stays valid when idle. Examples: `120` = 2 hours, `1440` = 24 hours, `525600` = 1 year. Use `unlimited` (or `forever`) for a very long-lived session (10 years). Default: `120`.
- `SESSION_EXPIRE_ON_CLOSE` — Set to `true` to make the session cookie a “session cookie” that expires when the browser is closed (server-side lifetime still applies for cleanup).

## Performance: GET /auth/me

`GET /api/v1/auth/me` is used on every app load (cookie-based auth). It is optimized with a single eager-loaded query. Sessions are stored in **Redis** by default (see `SESSION_DRIVER=redis` in `.env.example`), which keeps session read latency low. Ensure Redis is running (`docker compose up -d` includes Redis) and that `REDIS_HOST` matches your setup (e.g. `redis` when the API runs in Docker).

## Outbox Publisher

The API uses an outbox pattern for reliable event publishing. Unpublished events are stored in the `outbox_events` table and published to Redis Streams.

**Publish events manually:**
```bash
php artisan outbox:publish
```

**Schedule automatic publishing (add to cron):**
```bash
* * * * * cd /path-to-api && php artisan outbox:publish --limit=100
```

## Testing

Tests use Pest (built on PHPUnit). See `tests/Feature/` for examples.

```bash
composer test
```

## License

MIT