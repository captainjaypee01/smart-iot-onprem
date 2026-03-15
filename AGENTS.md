# AGENTS.md — Project Standards & Agent Rules (Smart IoT On-Prem)

This file is the single source of truth for how AI agents (Cursor Agent, etc.) and humans contribute to this repo.
It includes:
- Global rules (apply everywhere)
- Component rules (Web / API / IoT Services / Infra)
- IoT reliability rules (idempotency, retries, ordering, offline)
- Contract rules (Wirepas MQTT protobuf topics vs our custom topics)

> NOTE FOR CURSOR:
> - If you want the agent to ALWAYS follow these rules, mirror the key points into `.cursor/rules/*.md`.
> - Otherwise, include this file in prompts using `@AGENTS.md` and also reference contract docs with `@docs/contracts/...`.
> Cursor supports `@` mentions for context and `.cursor/rules/` for always-on rules. :contentReference[oaicite:3]{index=3}

---

## 0) Golden Rules (Non-Negotiables)

1) Small, focused changes
- One task = one purpose.
- No unrelated refactors in feature/bugfix PRs.

2) Tests are mandatory
- Bugfix: add a failing test first, then fix.
- Feature: add unit tests + at least one integration/contract test where applicable.

3) No silent behavior changes
- If changing contracts (MQTT payloads/topics), DB schema, state machine → update docs + tests.

4) Reliability first (IoT reality)
- Messages can be duplicated, delayed, out of order.
- Consumers must be idempotent and safe to retry.

5) Security by default
- Never log secrets/tokens/passwords.
- Internal endpoints require internal auth (token header).
- Validate all inputs and payload schemas.

6) Keep scope boundaries
- Only change files in the component you’re working on unless explicitly required.
- If a change crosses components, create a short spec in `docs/specs/` first.

---

## 1) Repo Structure & Ownership Boundaries

- web/                React + TypeScript UI
- api/                Laravel API (Postgres + Redis)
- services/iot/        Node + TypeScript (MQTT + Redis Streams)
- infra/              Mosquitto config, compose helpers
- docs/contracts/     Contracts (MQTT topics, payloads)
- docs/specs/         Short feature specs / design notes

Rule:
- Web changes stay in `web/`
- API changes stay in `api/`
- IoT runtime changes stay in `services/iot/`
- Infra changes stay in `infra/` + `docker-compose.yml`

---

## 2) System Design (Do Not Break)

### 2.1 Command Flow (Event-Driven, No DB Polling)
1) Web -> API: create command request
2) API writes `commands` + `outbox_events` in ONE DB transaction
3) Outbox publisher publishes event into Redis Streams
4) IoT Dispatcher consumes stream -> publishes MQTT command
5) IoT Ack Listener consumes MQTT ack -> calls API internal endpoint -> updates command status

Important:
- Node services MUST NOT write directly to Postgres.
- Only API writes DB; services call API internal endpoints.

---

## 3) MQTT Rules (Critical)

### 3.1 Wirepas Gateway↔Backend Topics (Protobuf, FIXED)
Wirepas gateway_to_backend MQTT interface uses messages encoded as Protocol Buffers (syntax 2). :contentReference[oaicite:4]{index=4}

Source of truth:
- `docs/contracts/wirepas-topics.md`

Rules:
- Do NOT change Wirepas topic patterns.
- Do NOT publish JSON on Wirepas topics.
- Treat Wirepas topics as a strict contract: topic + protobuf schema must match.

### 3.2 Our Custom App Topics (Non-Protobuf, Versioned)
Source of truth:
- `docs/contracts/custom-topics.md`

Rules:
- Custom topics MUST be namespaced to avoid collisions with Wirepas, e.g.:
  - `app/{tenant}/...` OR `custom/{tenant}/...`
- Custom payloads MUST be versioned, e.g. `{ "v": 1, ... }`
- Validate custom payload schemas:
  - Node: Zod (or equivalent)
  - API: Laravel validation rules

Forbidden:
- Using `gw-request/*`, `gw-response/*`, `gw-event/*` for custom JSON payloads.

---

## 4) Command State Machine (Must Follow)

Minimum states:
- PENDING -> QUEUED -> DISPATCHED -> ACKED
Failure exits:
- FAILED, TIMEOUT

Rules:
- Transitions must be explicit and tested.
- Duplicate events/acks must not cause invalid transitions.
- Late acks must be handled safely (idempotent, no regressions).

---

## 5) IoT Reliability Rules (Apply to Services + API)

Assume:
- MQTT duplicates, disconnects, reorderings
- Gateways/devices can go offline
- Network partitions happen

Must implement:
- Idempotency key: command_id
- Retry with backoff for publish/HTTP calls
- Command expiration (expires_at) and timeouts
- Exactly-once is NOT assumed; we build at-least-once + idempotent processing

---

## 6) Logging & Observability

Log with correlation IDs:
- command_id, tenant_id, gateway_id, device_id

Logging rules:
- Structured logs (JSON preferred in services)
- Never log secrets
- Log errors with:
  - what happened
  - impact
  - next action (retry / dead-letter / abort)

---

## 7) Security Rules

### 7.1 Internal endpoints (Services -> API)
- Must require `X-Internal-Token` (or equivalent)
- Token comes from environment variables
- Never commit secrets to git

### 7.2 API input validation
- Validate every request (including internal endpoints)
- Rate-limit sensitive endpoints (especially commands)

---

## 8) Component Standards

## 8A) Web (React + TypeScript) Standards
Goal: predictable UI, accessible, testable.

Rules:
- Use TypeScript everywhere.
- Prefer small components; keep logic in hooks.
- Forms:
  - Use react-hook-form + zod (recommended) OR an equivalent typed validator.
  - Always validate on submit; show field errors.
- Data fetching:
  - Prefer a single pattern (e.g., fetch wrapper + react-query if you choose it).
- Accessibility:
  - Labels for inputs, keyboard navigable, proper button types.

### 8A.1) Permission-based UI
- **Source of truth**: API returns permission keys (e.g. `user.view`, `user.create`) in `/auth/me`, login, and set-password responses. Auth store holds `user` and `permissions: string[]`; `setAuth(user, permissions)`.
- **Generic check**: Use `usePermission().hasPermission(key)` for any permission key. Never hardcode role strings for gating; use permission keys that match the API.
- **Module-specific helpers**: For a given module (e.g. users), create a dedicated hook (e.g. `useUserPermissions`) that exposes named helpers: `canViewUsers()`, `canCreateUser()`, `canUpdateUser()`, `canDeleteUser()`, `canDisableUser()`, `canResendInvite()`, `canChangeStatus()`, `canChangeCompany()`. Each helper maps to a single `hasPermission("user.xxx")` call. Use these in the page and dialogs so each action has a named permission you can reason about and adjust per role.
- **Where to enforce**:
  - **Page access**: Redirect or block entry when the user lacks the view permission (e.g. `canViewUsers()` for `/users`).
  - **Buttons / row actions**: Show Invite only if `canCreateUser()`, Edit only if `canUpdateUser()`, Delete only if `canDeleteUser()`, etc.
  - **Dialog sections**: Show company or status controls only when the user has the right permission (e.g. superadmin and `canChangeCompany()` / `canChangeStatus()`).
- **Navigation**: In nav config, use `permission: "user.view"` (or other key) for items that should show only when the user has that permission. Sidebar filters with `usePermission().hasPermission(item.permission)`; fall back to `adminOnly` + `useRole().isAdmin()` when a single “admin” gate is enough.
- **Principle**: API enforces permissions authoritatively; the frontend mirrors them for UX (hide buttons/sections when not allowed).

### 8A.2) Lifting shared data to avoid duplicate API calls
- When **multiple children** (e.g. two dialogs on the same page) need the **same fetched data** (e.g. company options), **lift the fetch to the parent**: call the hook (e.g. `useCompanies()`) once in the page and pass the result (e.g. `companies`, `companiesLoading`) as props to each child.
- Avoid calling the same data-fetching hook in multiple sibling components that are always mounted (e.g. dialogs rendered in the tree with `open={false}`). Otherwise each mount triggers its own request and, with React Strict Mode in development, you get duplicate or quadruplicate calls.
- Pattern: one subscription to the data at the page level; children receive data via props.

### 8A.3) Server-side pagination and shared table component
- Use the shared **`DataTableServer`** component for server-side paginated tables. Pass: `columns`, `data`, `isLoading`, `emptyMessage`, `meta`, `page`, `onPageChange`, and optionally `perPage`, `onPerPageChange`, `perPageOptions` for “rows per page” control.
- Define columns as an array of `{ id, header, cell(row), className? }`. Keep row actions (Edit, Delete, etc.) behind the same permission helpers used elsewhere (e.g. `canUpdateUser()`, `canDeleteUser()`).
- Pagination state (page, perPage) lives in the page or a custom hook (e.g. `useUsers()`) that calls the API with `page` and `per_page`; the API returns `meta` (e.g. `current_page`, `last_page`, `per_page`, `total`). No client-side pagination of full lists; fetch by page.

### 8A.4) Display strings and UI constants
- All user-facing strings (labels, buttons, messages) come from a central place (e.g. `src/constants/strings.ts` or module-specific `USER_STRINGS`, `UI_STRINGS`). No hardcoded display strings in JSX.
- Use `cn()` for conditional class names; support dark mode with Tailwind `dark:` variants where applicable.

Testing:
- Unit: component logic and helpers
- E2E (later): Playwright for critical flows

Definition of done (web):
- Form validates + shows errors
- API errors surfaced to user
- Loading/empty states included
- At least 1 unit test for non-trivial logic

## 8B) API (Laravel) Standards
Goal: thin controllers, strong domain logic, safe DB writes.

Rules:
- Controllers must be thin:
  - validation + call service/use-case + return response
- Domain logic lives in services/actions.
- Use DB transactions for operations that must be atomic (e.g., command + outbox).
- Use DTOs/resources for consistent responses.
- Migrations must be reversible.
- Never let Node write DB directly.

Testing:
- Pest unit tests for domain logic
- Feature tests for endpoints
- Integration tests for outbox behavior

Definition of done (api):
- Request validation included
- Transactional outbox created in same transaction as command record
- Feature test added/updated

## 8C) IoT Services (Node + TypeScript) Standards
Goal: resilient runtime (reconnect, retry, idempotent).

Rules:
- TypeScript strict mode recommended.
- Never write to Postgres.
- Consume Redis Streams using consumer groups (recommended).
- MQTT:
  - handle reconnect
  - handle duplicate messages safely
- Parsing:
  - Wirepas topics: protobuf decoding/encoding (per Wirepas contract)
  - Custom topics: JSON + schema validation
- All outbound calls to API must include internal auth header.

Testing:
- Unit: payload parsing + routing + idempotency logic
- Integration: with docker compose broker + redis + api

Definition of done (services):
- Reconnect strategy documented
- Retries/backoff implemented for key operations
- At least 1 test covering duplicate ack or retry scenario

## 8D) Infra (Docker / On-Prem) Standards
Goal: one-command boot, deterministic environments.

Rules:
- Everything runs via docker compose (dev).
- Use persistent volumes for Postgres and Mosquitto data.
- Healthchecks for core services (db, redis).
- Keep configuration via env vars and config files in infra/.
- No secrets in repo; use `.env.example`.

Definition of done (infra):
- `docker compose up -d` works
- Basic verification steps documented in README

---

## 9) Docs & Contracts

Contracts live in:
- `docs/contracts/wirepas-topics.md`  (Wirepas protobuf topics)
- `docs/contracts/custom-topics.md`   (our custom topics + payloads)

Rules:
- Any change to topic/payload/state machine -> update docs + tests same PR.
- Keep docs short and specific; prefer examples.

---

## 10) Required “How to Verify” Commands (update as repo grows)

Start infra:
- docker compose up -d
- docker compose ps

API tests:
- docker compose exec api php artisan test

Web checks:
- docker compose exec web npm run typecheck
- docker compose exec web npm test

Services checks:
- docker compose exec iot npm test

---

## 11) Required Agent Output Format (Every task)

Agents must respond with:
1) Plan (1–5 bullets)
2) Files to change (explicit list)
3) Implementation (what changed)
4) How to verify (exact commands)
5) Risks/notes (edge cases, migrations, backward compat)

Agents must not change files outside the stated scope unless explicitly asked.

---

## 12) Forbidden Actions

- Add DB polling loops for command dispatch (must use outbox + stream).
- Write directly to Postgres from Node services.
- Publish JSON on Wirepas `gw-*` topics (Wirepas topics are protobuf only). :contentReference[oaicite:5]{index=5}
- Change MQTT topic patterns without updating contracts + tests.
- Log secrets or commit `.env` files.
- Large refactors without approval/spec.
- **Web**: Gate features by hardcoded role names (e.g. `role === 'admin'`); use permission keys and `usePermission()` / module `can*()` helpers instead.
- **Web**: Call the same data-fetching hook in multiple sibling components that are always mounted (e.g. two dialogs each calling `useCompanies()`); lift the hook to the parent and pass data as props.

---
