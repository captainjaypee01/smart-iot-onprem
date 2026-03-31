# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mandatory Reading

**Always read `AGENTS.md` before making any changes.** It is the single source of truth for project rules, architecture decisions, output format requirements, and prohibited patterns. Key rules are summarized below, but `AGENTS.md` is authoritative.

## Project Overview

Smart IoT on-premises management platform consisting of:
- `api/` — Laravel 12 / PHP 8.4 REST API (PostgreSQL + Redis)
- `iot-dashboard/` — React 19 / TypeScript / Vite SPA (shadcn/ui + Tailwind v4)
- `infra/` — Mosquitto MQTT broker, Postgres init scripts, Caddy reverse proxy
- `observability/` — Prometheus, Grafana, Loki, Alloy, Alertmanager
- `docs/` — System blueprint, MQTT contracts, module specs (source of truth for API contracts)

## Commands

### Docker-based development (primary workflow)

```bash
cp .env.dev .env         # First time only
make dev                 # Start full dev stack
make down                # Stop all services
make logs SERVICE=api    # Tail a service's logs
make shell-api           # Exec into API container
make migrate             # Run pending migrations
make migrate-fresh       # Drop + re-migrate + seed
make test-api            # Run API test suite
```

Dev endpoints: Dashboard `http://localhost:5173`, API `http://localhost:8000`, Grafana `http://localhost:3000`.

### API (Laravel) — run inside container or with local PHP 8.4

```bash
composer test            # Pest test suite
composer pint            # Code style (Laravel Pint)
composer analyse         # PHPStan static analysis
php artisan test --filter=TestName   # Single test
php artisan test tests/Feature/Path/To/Test.php  # Single file
```

### Frontend (React) — run from `iot-dashboard/`

```bash
npm install
npm run dev              # Vite dev server (only needed outside Docker)
npm run build            # Production build
npm run typecheck        # TypeScript check (tsc --noEmit)
```

## Architecture

### Event-Driven Command Flow

Commands follow a strict, non-polling flow:

```
Frontend → API (create command)
  → API writes commands + outbox_events in ONE transaction
  → Outbox publisher reads outbox_events → publishes to Redis Streams
  → IoT Dispatcher consumes stream → publishes MQTT command
  → IoT Ack Listener consumes MQTT ack → calls API internal endpoint → updates status
```

Command state machine: `PENDING → QUEUED → DISPATCHED → ACKED` (failure exits: `FAILED`, `TIMEOUT`). State transitions must be idempotent — duplicate events must never cause invalid transitions.

**Node services (future `services/`) must NEVER write to Postgres directly.** They call internal API endpoints (`X-Internal-Token` header required).

### API Patterns

- **Actions pattern**: Business logic lives in `app/Actions/{Domain}/` (e.g., `StoreUserAction`, `CreateCommandAction`). Controllers are thin: validate → call action → return resource.
- **Outbox pattern**: Commands and their outbox events are always written in a single DB transaction to guarantee no message loss.
- **DTOs**: `app/DTO/{Domain}/` — validated request data flows to action via DTO.
- **Resources**: `app/Http/Resources/Api/V1/` — all API responses go through resource classes.
- **Policies**: `app/Policies/` — all authorization via Laravel policies, never inline role checks.

### Frontend Patterns

- **Auth/permissions**: `useAuthStore` (Zustand) holds `user` and `permissions`. Always use `usePermission().hasPermission(key)` — never hardcode role checks.
- **Module-specific helpers**: Add named helpers like `canViewUsers()` to module-specific hooks (`useUserPermissions()`), don't scatter `hasPermission()` calls in components.
- **Data fetching**: Lift shared data to parent components to avoid duplicate API calls. Pass via props.
- **Tables**: Use `DataTableServer` for server-side paginated tables.
- **Strings**: No hardcoded user-facing strings in JSX — use constants.
- **Loading states**: Buttons must be disabled with a spinner during async mutations.

### Authorization Model (3-layer RBAC)

Users have a Role. Roles are assigned:
- **Permissions** — what actions the user can perform (e.g., `users.view`, `users.create`)
- **Features** — which UI modules are accessible (sidebar navigation)
- **Networks** — which IoT networks the user can see/manage

Roles can also be scoped to specific Companies (`role_companies` pivot).

### MQTT Rules

- **Wirepas topics** (`gw-*`): protobuf only, never JSON. See `docs/contracts/wirepas-topics.md`.
- **Custom topics**: must be namespaced (`app/{tenant}/`), payloads must be versioned (`{ "v": 1, ... }`). See `docs/contracts/custom-topics.md`.

## Module Contracts

Before implementing or modifying any module, read the relevant contract in `docs/specs/`:
- `user-module-contract.md`, `company-module-contract.md`, `role-module-contract.md`
- `network-module-contract.md`, `node-type-module-contract.md`
- `feature-module-contract.md`, `permission-module-contract.md`

Cross-component changes (touching both `api/` and `iot-dashboard/`) require a spec in `docs/specs/` first.

## Required Output Format (from AGENTS.md)

When completing a task, always output:
1. **Plan** (1–5 bullets)
2. **Files changed** (explicit list)
3. **Implementation** (what changed and why)
4. **How to verify** (exact commands to run)
5. **Risks/notes** (migrations, backward compat, edge cases)

## Environment Files

| Scope | Dev file | Notes |
|-------|----------|-------|
| Docker Compose root | `.env.dev` | Copied to `.env` |
| Laravel API | `api/.env.dev` | Standard Laravel `.env` |
| React frontend | `iot-dashboard/.env.development` | Vite build-time vars only |

`REDIS_PASSWORD` must match between root `.env` and `api/.env`. See `docs/ENV_FILES.md` for the full reference.


## Module Contracts

Before implementing or modifying any module, read the relevant contract in `docs/specs/`:
- `user-module-contract.md`, `company-module-contract.md`, `role-module-contract.md`
- `network-module-contract.md`, `node-type-module-contract.md`
- `feature-module-contract.md`, `permission-module-contract.md`
- `node-provisioning-module-contract.md`   ← ADD THIS LINE

Cross-component changes (touching both `api/` and `iot-dashboard/`) require a spec in `docs/specs/` first.