# Security Guidelines

## Authentication Overview

The API uses two authentication mechanisms:

| Mechanism | Used By | How |
|---|---|---|
| Sanctum Bearer Token | React SPA | `Authorization: Bearer <token>` header |
| Internal Token | Backend IoT services | `X-Internal-Token` header |

---

## Sanctum Bearer Token Auth (SPA)

### How It Works

1. **Login (email/password)**: SPA posts credentials to `POST /api/v1/auth/login`. API validates and returns `{ user, token }`.
2. **Login (Microsoft SSO)**: SPA fetches redirect URL, browser navigates to Microsoft, Laravel callback issues the token, browser redirects to SPA with `?token=` in URL.
3. **Token Storage**: SPA stores token in Zustand (persisted to localStorage). The Axios client reads it from `useAuthStore.getState().token` on every request.
4. **Token Revocation**: `POST /api/v1/auth/logout` deletes the current token server-side. SPA clears Zustand on logout.
5. **401 Handling**: The Axios interceptor calls `useAuthStore.logout()` and redirects to `/login` on any 401 response globally.

### Why Bearer Token (not cookies)

Cookie-based Sanctum sessions are incompatible with the Microsoft OAuth redirect flow. The OAuth callback is a browser redirect — there is no fetch request to initialize a session on. Bearer tokens work cleanly with both email/password and SSO flows.

### Security Considerations

- **Token scope**: Tokens are named (`spa-password`, `spa-microsoft`) for auditability. Consider revoking all other tokens on new login (optional hardening).
- **localStorage risk**: Acceptable on internal, controlled on-prem networks. For higher-security environments, consider session storage or short-lived tokens.
- **Token expiry**: Configure in `config/sanctum.php` → `expiration` (minutes). `null` means no expiry — set a value in production.
- **HTTPS**: In production, all traffic must be HTTPS. Set `SESSION_SECURE_COOKIE=true`.

---

## Microsoft SSO Security

### Flow Security

- The **client secret never touches the browser**. The SPA only receives a `{ redirect_url }` from the API.
- The OAuth code exchange happens entirely server-side in `MicrosoftCallbackController`.
- **No auto-registration**: The callback matches the Microsoft email to an existing `users` row only. Unknown emails receive a `?error=account_not_found` redirect — they cannot create an account.
- **Stateless OAuth**: Socialite is used in stateless mode — no server-side session required.
- The callback redirects the browser to `{FRONTEND_URL}/auth/callback?token=...&user=...`. The SPA must immediately read and clear these params using `window.history.replaceState`.

### Azure App Registration

- **Redirect URIs**: Only register exact URIs in Azure Portal. Never use wildcards.
- **Supported account types**: Use "Accounts in this organizational directory only" (single tenant) unless you have multiple company Azure ADs.
- **Client secret rotation**: Rotate `MICROSOFT_CLIENT_SECRET` every 12-24 months. Update Azure Portal and `.env` simultaneously.
- **Permissions**: Only `User.Read` (delegated) is required. Do not grant unnecessary permissions.

### Environment Variables

```env
MICROSOFT_CLIENT_ID=your-azure-app-client-id
MICROSOFT_CLIENT_SECRET=your-azure-app-client-secret
MICROSOFT_REDIRECT_URI=https://your-api.domain.com/auth/microsoft/callback
MICROSOFT_TENANT_ID=organizations  # or specific tenant ID for single-tenant
FRONTEND_URL=https://your-frontend.domain.com
```

---

## Internal API Token

Backend services (IoT services) authenticate using a shared secret token.

### Configuration

```env
INTERNAL_API_TOKEN=your-secret-token-here
```

### Usage

```bash
curl -X POST https://api.domain.com/internal/commands/123/mark-dispatched \
  -H "X-Internal-Token: your-secret-token-here" \
  -H "Content-Type: application/json"
```

### Security Considerations

- Never commit tokens to git — use `.env` files (gitignored)
- Rotate `INTERNAL_API_TOKEN` periodically
- Use different tokens per environment (dev/staging/prod)

---

## User Invite Security

### Invite Token

- Stored in `password_reset_tokens` (shared table, different semantic)
- Random 64-char string (`Str::random(64)`)
- Expires after **60 minutes** — validated in `SetPasswordController`
- Deleted after successful password set
- `ResendInviteController` regenerates and replaces the token — old link becomes invalid

### Welcome Email Link

```
{FRONTEND_URL}/set-password?token={64-char-token}&email={url-encoded-email}
```

- Token is useless without the matching email
- Email is verified against `users` table in `SetPasswordRequest` (`exists:users,email`)
- Both token and email must match the `password_reset_tokens` row

---

## Rate Limiting

### Recommended Limits

- **Auth endpoints** (`/auth/login`, `/auth/set-password`): 5 requests/minute per IP — prevent brute force
- **Public API**: 60 requests/minute per user
- **Internal API**: 1000 requests/minute per token

### Implementation

```php
// routes/api.php
Route::prefix('auth')->group(function () {
    Route::post('/login', LoginController::class)->middleware('throttle:5,1');
    Route::post('/set-password', SetPasswordController::class)->middleware('throttle:5,1');
});
```

---

## CORS Configuration

```php
// config/cors.php
'allowed_origins'     => [env('FRONTEND_URL', 'http://localhost:5173')],
'allowed_methods'     => ['*'],
'allowed_headers'     => ['*'],
'exposed_headers'     => ['X-Request-Id'],
'supports_credentials' => false, // false — we use Bearer tokens, not cookies
```

> `supports_credentials` must be `false` when using Bearer token auth. Set to `true` only if you switch to cookie sessions.

---

## Input Validation

- **Always validate** using FormRequest classes for all inputs
- **Type checking**: Use strict types and type hints throughout
- Auth inputs use `LoginRequest`, `SetPasswordRequest`, `StoreUserRequest`, `UpdateUserRequest`

---

## What to Never Log

- Passwords
- Sanctum tokens (plain-text)
- Microsoft client secrets or OAuth codes
- Session IDs
- Invite tokens

---

## Production Security Checklist

- [ ] `SESSION_SECURE_COOKIE=true` (HTTPS required)
- [ ] `APP_ENV=production`, `APP_DEBUG=false`
- [ ] `MICROSOFT_REDIRECT_URI` set to production domain in `.env` **and** Azure Portal
- [ ] `FRONTEND_URL` set to production domain
- [ ] `INTERNAL_API_TOKEN` is a strong random value (not the dev default)
- [ ] Mail driver configured (SMTP / Mailgun / SES) for invite emails
- [ ] Queue worker running (`php artisan queue:work`) for `WelcomeUserNotification`
- [ ] Sanctum token expiry configured (`config/sanctum.php`)
- [ ] Rate limiting on auth endpoints
- [ ] CORS restricted to production frontend domain only
- [ ] HTTPS enabled on both API and frontend domains
- [ ] Client secret rotation schedule established (every 12-24 months)
- [ ] Secrets not committed to git (`.env` gitignored)