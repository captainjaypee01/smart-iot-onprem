# Smart IoT On-Prem API

Laravel API service for the Smart IoT On-Prem product.

## Quick Start

### Prerequisites

- PHP 8.2+
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

- `POST /api/v1/auth/login` - Login (creates session)
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/commands` - Create command (requires auth)

### Internal API (Backend Services)

Base URL: `/internal`

Requires `X-Internal-Token` header.

- `POST /internal/commands/{id}/mark-dispatched` - Mark command as dispatched
- `POST /internal/commands/{id}/mark-acked` - Mark command as acked
- `POST /internal/commands/{id}/mark-completed` - Mark command as completed
- `POST /internal/commands/{id}/mark-failed` - Mark command as failed

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
│   └── Auth/             # Authentication actions (future)
├── Contracts/            # Interfaces for dependency injection
├── Console/              # Artisan commands
│   └── Commands/         # Custom commands (e.g., outbox:publish)
├── DTO/                  # Data Transfer Objects
│   └── Commands/         # Command-related DTOs
├── Enums/                # Type-safe enumerations
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/       # Public API controllers
│   │   └── Internal/     # Internal API controllers
│   ├── Middleware/       # Custom middleware
│   ├── Requests/         # FormRequest validation
│   └── Resources/        # JSON API resources
├── Models/               # Eloquent models
└── Services/            # Service classes (e.g., OutboxPublisherService)

routes/
├── api.php               # Public API routes
└── internal.php          # Internal API routes
```

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

## Environment Variables

Key variables (see `env.example` for full list):

- `APP_URL` - API base URL
- `FRONTEND_URL` - SPA frontend URL (for CORS)
- `SANCTUM_STATEFUL_DOMAINS` - Domains allowed for Sanctum cookies
- `INTERNAL_API_TOKEN` - Token for internal API endpoints
- `DB_*` - Database configuration
- `REDIS_*` - Redis configuration
- `SESSION_SECURE_COOKIE` - Set to `true` in production (HTTPS required)

## Testing

Tests use Pest (built on PHPUnit). See `tests/Feature/` for examples.

Run tests:
```bash
composer test
```

## License

MIT
