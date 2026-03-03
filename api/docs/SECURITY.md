# Security Guidelines

## Sanctum SPA Authentication

The API uses Laravel Sanctum for SPA (Single Page Application) authentication via cookie-based sessions.

### How It Works

1. **Login**: SPA sends credentials to `/api/v1/auth/login`
2. **Session**: Laravel creates a session cookie
3. **CSRF**: SPA must fetch `/sanctum/csrf-cookie` first (for CSRF protection)
4. **Subsequent Requests**: Browser automatically sends session cookie

### Configuration

**Environment Variables:**
```env
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false  # true in production with HTTPS
SESSION_SAME_SITE=lax
```

**CORS:**
- `supports_credentials: true` (required for cookies)
- `allowed_origins` must match `SANCTUM_STATEFUL_DOMAINS`
- `exposed_headers: ['X-Request-Id']`

### SPA Setup (React Example)

```typescript
// 1. Fetch CSRF cookie first
await fetch('http://api.localhost:8000/sanctum/csrf-cookie', {
  credentials: 'include',
});

// 2. Login
const response = await fetch('http://api.localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important!
  body: JSON.stringify({ email, password }),
});

// 3. Subsequent requests automatically include cookie
const data = await fetch('http://api.localhost:8000/api/v1/auth/me', {
  credentials: 'include',
});
```

### Security Considerations

- **CSRF Protection**: Sanctum validates CSRF tokens for stateful requests
- **Same-Site Cookies**: Set to `lax` (or `strict` for stricter security)
- **Secure Cookies**: Enable `SESSION_SECURE_COOKIE=true` in production (HTTPS only)
- **Session Lifetime**: Default 120 minutes (configurable)

## Internal API Token

Backend services (IoT services) authenticate using a shared secret token.

### Configuration

```env
INTERNAL_API_TOKEN=your-secret-token-here
```

### Usage

Backend services must send the token in the `X-Internal-Token` header:

```bash
curl -X POST http://api.localhost:8000/internal/commands/123/mark-dispatched \
  -H "X-Internal-Token: your-secret-token-here" \
  -H "Content-Type: application/json"
```

### Security Considerations

- **Never commit tokens to git**: Use `.env` files (gitignored)
- **Rotate tokens regularly**: Change `INTERNAL_API_TOKEN` periodically
- **Use different tokens per environment**: Dev/staging/prod should have different tokens
- **Rate limiting**: Internal endpoints should have rate limits (future enhancement)

## Rate Limiting

### Current Setup

- API routes use `throttleApi()` middleware (60 requests/minute by default)
- Internal routes should have separate limits (future enhancement)

### Recommended Limits

- **Public API**: 60 requests/minute per IP
- **Internal API**: 1000 requests/minute per token
- **Auth endpoints**: 5 requests/minute per IP (prevent brute force)

## Input Validation

### Rules

- **Always validate**: Use FormRequest classes for all inputs
- **Sanitize**: Laravel automatically sanitizes inputs
- **Type checking**: Use strict types and type hints
- **JSON Schema**: Validate JSON payloads match expected structure

### Example

```php
public function rules(): array
{
    return [
        'email' => ['required', 'email', 'max:255'],
        'device_id' => ['required', 'string', 'regex:/^[a-z0-9-]+$/'],
        'payload' => ['required', 'array'],
        'payload.temperature' => ['required', 'numeric', 'between:0,100'],
    ];
}
```

## Secrets Management

### Never Log

- Passwords
- API tokens
- Session IDs
- Encryption keys
- Database credentials

### Environment Variables

- Store secrets in `.env` (gitignored)
- Use `.env.example` for documentation (with placeholder values)
- Never commit `.env` files

## Database Security

- **Use parameterized queries**: Eloquent does this automatically
- **Validate foreign keys**: Use `constrained()` in migrations
- **Limit exposure**: Don't expose internal IDs unnecessarily (use ULIDs)
- **Encrypt sensitive data**: Use Laravel's encryption for sensitive fields

## HTTPS in Production

- **Enable HTTPS**: Use reverse proxy (nginx/traefik) with SSL certificates
- **Force HTTPS**: Set `SESSION_SECURE_COOKIE=true`
- **HSTS**: Enable HTTP Strict Transport Security headers
- **Certificate validation**: Use Let's Encrypt or trusted CA

## Authorization

### Policies

Use Laravel Policies for resource-level authorization:

```php
// app/Policies/CommandPolicy.php
public function update(User $user, Command $command): bool
{
    return $user->id === $command->user_id;
}
```

### Gates

Use Gates for action-level authorization:

```php
Gate::define('manage-devices', function (User $user) {
    return $user->isAdmin();
});
```

## Security Checklist

- [ ] Sanctum CSRF protection enabled
- [ ] CORS configured correctly (restrictive origins)
- [ ] Internal token set and secure
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Secrets not logged
- [ ] HTTPS enabled in production
- [ ] Session cookies secure in production
- [ ] Database credentials secure
- [ ] Authorization policies in place
