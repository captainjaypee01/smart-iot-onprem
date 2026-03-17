# Architecture Decision Records (ADRs)

This document records key architectural decisions and their rationale.

---

## ADR-001: Sanctum Cookie-Based SPA Authentication

**Status**: Accepted
**Date**: 2026-01-16 (revised 2026-03-14)
**Context**: Need to authenticate React SPA with Laravel API, including SSO flows. Security hardening: avoid storing auth credentials in JS (XSS).

**Decision**: Use Laravel Sanctum **SPA authentication** with **httpOnly session cookies**. No token in the SPA; the API sets a session cookie on login and on Microsoft OAuth callback redirect. The frontend sends credentials (`withCredentials: true`) and a CSRF token on state-changing requests.

**Rationale**:
- **Security**: httpOnly cookies are not readable by JavaScript; XSS cannot exfiltrate the session.
- **SSO Compatibility**: The API sets the session cookie on the **redirect response** from the Microsoft callback, then redirects to the SPA. No token in the URL.
- **Industry practice**: Cookie-based auth is standard for web SPAs when same-site or CORS credentials are available.

**Alternatives Considered**:
- **Bearer token in localStorage**: Simpler but vulnerable to XSS; previously used, superseded by this ADR.
- **JWT**: More complex, requires refresh logic, no built-in Laravel support.

**Consequences**:
- SPA must call `GET /sanctum/csrf-cookie` before first POST/PUT/PATCH/DELETE and send `X-XSRF-TOKEN` header.
- `axiosClient` uses `withCredentials: true`; no `Authorization` header.
- Auth store holds only `user` (from `GET /auth/me`); no token persisted.
- Sanctum `stateful` domains must include the SPA origin (e.g. `localhost:5173`).

---

## ADR-002: Internal Token Authentication for Backend Services

**Status**: Accepted
**Date**: 2026-01-16
**Context**: Backend services (IoT services) need to call API internal endpoints.

**Decision**: Use simple token-based authentication via `X-Internal-Token` header.

**Rationale**:
- **Simplicity**: Single shared secret, easy to configure
- **Performance**: No OAuth/JWT overhead
- **On-Prem Context**: Services run in same network, lower security risk
- **Stateless**: No session management needed

**Consequences**:
- Token rotation requires coordination across services
- Single token compromise affects all services

---

## ADR-003: Outbox Pattern for Event-Driven Architecture

**Status**: Accepted
**Date**: 2026-01-16
**Context**: Need reliable event publishing (command creation -> Redis Streams) without losing events.

**Decision**: Use transactional outbox pattern: write command + outbox event in same DB transaction.

**Rationale**:
- **Reliability**: Ensures events are never lost (atomic write)
- **Consistency**: Command and event creation are atomic
- **Decoupling**: Publisher service can be separate from API

**Consequences**:
- Requires outbox publisher service
- Events may be delayed if publisher is down (acceptable for IoT use case)
- Need to handle duplicate events (idempotent consumers)

---

## ADR-004: Command State Machine

**Status**: Accepted
**Date**: 2026-01-16
**Context**: Commands transition through multiple states.

**Decision**: Implement explicit state machine with enum and transition validation.

**State Flow**:
```
PENDING -> QUEUED -> DISPATCHED -> ACKED -> COMPLETED
   |         |          |           |
   v         v          v           v
FAILED    FAILED    FAILED      FAILED
TIMEOUT   TIMEOUT   TIMEOUT     TIMEOUT
```

**Consequences**:
- Must handle late acks (idempotent)
- Terminal states cannot transition (by design)

---

## ADR-005: ULIDs for Command IDs

**Status**: Accepted
**Date**: 2026-01-16
**Context**: Need unique identifiers for commands that are URL-safe and sortable.

**Decision**: Use ULIDs instead of UUIDs or auto-increment IDs.

**Rationale**:
- Lexicographically sortable by creation time
- URL-safe, no special characters
- Don't expose sequence numbers (unlike auto-increment)

---

## ADR-006: Actions Pattern for Business Logic

**Status**: Accepted
**Date**: 2026-01-16
**Context**: Need to organize business logic without bloating controllers or models.

**Decision**: Use Action classes (use-case pattern) for business logic.

**Structure**:
```
app/Actions/
  Auth/
    StoreUserAction.php
  Commands/
    CreateCommandAction.php
    MarkCommandDispatchedAction.php
```

**Consequences**:
- Thin controllers — orchestrate only (validate → action → response)
- Actions are stateless and injectable
- Easy to unit test in isolation

---

## ADR-007: DTOs for Input Normalization

**Status**: Accepted
**Date**: 2026-01-16
**Context**: Need to normalize and validate input data before passing to actions.

**Decision**: Use readonly DTOs (Data Transfer Objects) for action inputs.

```php
readonly class StoreUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public int $companyId,
        public int $roleId,
        public int $assignedBy,
    ) {}
}
```

---

## ADR-008: Correlation IDs for Observability

**Status**: Accepted
**Date**: 2026-01-16
**Context**: Need to trace requests across services and logs.

**Decision**: Use `X-Request-Id` header for correlation IDs, auto-generate if missing.

---

## ADR-009: Pest for Testing

**Status**: Accepted
**Date**: 2026-01-16

**Decision**: Use Pest instead of PHPUnit directly for more expressive test syntax.

---

## ADR-010: PHPStan for Static Analysis

**Status**: Accepted
**Date**: 2026-01-16

**Decision**: Use PHPStan (via Larastan) for static analysis. All files use `declare(strict_types=1)`.

---

## ADR-011: Microsoft SSO via Laravel Socialite (Server-Side OAuth)

**Status**: Accepted
**Date**: 2026-03-10
**Context**: On-premise system needs SSO support. Users are invite-only — no self-registration.

**Decision**: Handle the full Microsoft OAuth flow server-side via Laravel Socialite. The SPA never touches OAuth credentials.

**Flow**:
1. SPA calls `GET /api/v1/auth/microsoft/redirect` → receives `{ redirect_url }`
2. SPA sets `window.location.href = redirect_url` (browser navigates away)
3. Microsoft authenticates the user and redirects to `GET /auth/microsoft/callback` (web route)
4. Laravel exchanges the code via Socialite (stateless), gets the user's email
5. Laravel looks up the email in `users` table — **no auto-registration ever**
6. If user not found → redirect to `{FRONTEND_URL}/login?error=account_not_found`
7. If user inactive → redirect to `{FRONTEND_URL}/login?error=account_disabled`
8. If user found → upsert `social_accounts`, issue Sanctum token, redirect to `{FRONTEND_URL}/auth/callback?token=...&user=...`
9. SPA reads token + user from URL, stores in Zustand, clears URL, navigates to dashboard

**Why `web.php` not `api.php` for callback**:
The callback receives a browser redirect from Microsoft, not an API fetch from the SPA. There is no Bearer token at this point, and the response must be an HTTP redirect, not JSON. Therefore it must be a web route.

**Package**: `socialiteproviders/microsoft` (not the built-in Socialite Microsoft driver).

**Rationale**:
- Client secret never touches the browser
- Consistent with OAuth best practices
- Socialite handles token exchange and user profile fetch cleanly

**Consequences**:
- Azure App Registration must have the exact callback URI registered
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`, `MICROSOFT_TENANT_ID` required in `.env`
- `social_accounts` table links Microsoft identity to existing users
- SSO never creates users — admin must create the user first with matching email

---

## ADR-012: Invite-Only User Creation with Welcome Email

**Status**: Accepted
**Date**: 2026-03-10
**Context**: On-premise system — no public registration. Users are added by admins.

**Decision**: Admins create users via `POST /api/v1/users`. The system sets `password = null` and sends a welcome email with a signed invite link.

**Flow**:
1. Admin sends `POST /api/v1/users` with `{ name, email, company_id, role_id }`
2. User is created with `password = null`, `is_active = true`
3. A random 64-char token is stored in `password_reset_tokens`
4. `WelcomeUserNotification` is dispatched (queued) with a link to `{FRONTEND_URL}/set-password?token=...&email=...`
5. User clicks the link → `SetPasswordPage` → `POST /api/v1/auth/set-password`
6. Token validated, password hashed and stored, token deleted, Sanctum token issued

**Key rules**:
- Invite tokens expire in 60 minutes
- `ResendInviteController` regenerates a fresh token and resends the email — only works if `password = null`
- Users can also skip the password entirely and use Microsoft SSO if their email is linked

**Consequences**:
- Mail driver must be configured in production
- Queue worker must be running for notification delivery (`ShouldQueue`)
- `password_reset_tokens` table is reused for invite tokens (same structure, different semantic)

---

## ADR-013: Controller Style — Single Controllers vs Single-Action

**Status**: Accepted  
**Date**: 2026-03-10 (revised 2026-03-17)  
**Context**: We need a consistent pattern for organising controllers across modules (Users, Roles, Permissions, etc.) while keeping auth and one-off actions simple.

**Decision**:
- Prefer **one controller per module/resource** (e.g. `UserController`, `RoleController`, `PermissionController`) with named methods for standard CRUD and closely related actions.
- Use `__invoke` **single-action controllers only for**:
  - Auth routes (Login, Logout, Me, MicrosoftRedirect, MicrosoftCallback, SetPassword)
  - One-off state changes (ResendInvite, DisableUser, etc.) that don't belong in the main CRUD flow.

**Rules**:
- CRUD-style modules → single controller with named methods (`index`, `show`, `store`, `update`, `destroy`, `options`, etc.).
- Auth and one-off actions → single-action controllers registered directly on the route.

**Rationale**:
- Keeps module behaviour discoverable in one place (especially for permissions and role/permission relationships).
- Reduces scattering of related logic across many files.
- Maintains simplicity for auth flows and state changes where single-action controllers shine.

**Consequences**:
- New modules should start with a single controller; introduce single-action controllers only when the action is clearly orthogonal to CRUD.