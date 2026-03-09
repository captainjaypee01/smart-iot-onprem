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

Base URL: `/api/v1`

#### Auth
- `POST /api/v1/auth/login` — Email + password login, returns Sanctum token
- `POST /api/v1/auth/logout` — Revokes current token (requires auth)
- `GET  /api/v1/auth/me` — Returns authenticated user (requires auth)
- `POST /api/v1/auth/set-password` — Sets password from invite link token
- `GET  /api/v1/auth/microsoft/redirect` — Returns Microsoft OAuth redirect URL for SPA

#### Microsoft SSO Callback (Web Route — not API)
- `GET  /auth/microsoft/callback` — Handles Microsoft OAuth callback, redirects to frontend

#### Users (requires auth)
- `GET    /api/v1/users` — List users (superadmin sees all, company admin sees own company)
- `GET    /api/v1/users/{user}` — View a single user
- `POST   /api/v1/users` — Create user + send welcome/invite email
- `PUT    /api/v1/users/{user}` — Update user name, email, or role
- `DELETE /api/v1/users/{user}` — Delete user
- `POST   /api/v1/users/{user}/resend-invite` — Resend welcome email (password-not-set users only)
- `POST   /api/v1/users/{user}/disable` — Toggle user active/disabled status

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

This API uses **two distinct auth mechanisms**:

### 1. SPA Token Auth (Sanctum)
The React frontend authenticates via Bearer token stored in the SPA (Zustand + localStorage). On login, the API returns a plain-text Sanctum token which the SPA attaches to every request via `Authorization: Bearer <token>`.

### 2. Microsoft SSO Flow
SSO is handled server-side:
1. SPA calls `GET /api/v1/auth/microsoft/redirect` → receives `{ redirect_url }`
2. SPA sets `window.location.href = redirect_url`
3. User authenticates with Microsoft
4. Microsoft redirects to `GET /auth/microsoft/callback` (web route, not API)
5. Laravel matches the Microsoft email to an existing user (no auto-registration)
6. Laravel issues a Sanctum token and redirects to `{FRONTEND_URL}/auth/callback?token=...&user=...`
7. SPA reads the token, stores it, clears the URL, and navigates to dashboard

### 3. User Invite Flow
Admins create users via `POST /api/v1/users`. The system:
1. Creates the user with `password = null`
2. Stores an invite token in `password_reset_tokens`
3. Sends a welcome email with a link to `{FRONTEND_URL}/set-password?token=...&email=...`
4. User sets their password via `POST /api/v1/auth/set-password`

> **Key rule**: Users are never auto-created from SSO. An admin must create the user first. SSO only authenticates users whose email already exists in the `users` table.

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
│   └── Auth/             # Authentication actions
├── Contracts/            # Interfaces for dependency injection
├── Console/              # Artisan commands
│   └── Commands/         # Custom commands (e.g., outbox:publish)
├── DTO/                  # Data Transfer Objects
│   └── Commands/         # Command-related DTOs
├── Enums/                # Type-safe enumerations
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/       # Public API controllers (SPA)
│   │   │   ├── Auth/     # Login, Logout, Me, MicrosoftRedirect, SetPassword
│   │   │   └── Users/    # UserController, ResendInviteController, DisableUserController
│   │   ├── Auth/         # MicrosoftCallbackController (web route, not API)
│   │   └── Internal/     # Internal API controllers (backend services)
│   ├── Middleware/       # Custom middleware
│   ├── Requests/         # FormRequest validation
│   └── Resources/        # JSON API resources
├── Models/               # Eloquent models
├── Notifications/        # WelcomeUserNotification (invite email)
└── Services/             # Service classes (e.g., OutboxPublisherService)

routes/
├── api.php               # Public API routes (/api/v1/*)
├── web.php               # Microsoft OAuth callback route (/auth/microsoft/callback)
└── internal.php          # Internal API routes (/internal/*)
```

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