# Environment Files — What Is Used Where

This doc explains which `.env` files are used by Docker Compose and by each application so you can keep only the ones you need and avoid confusion.

## Quick reference

| Context | Root (repo) | API (`api/`) | Dashboard (`iot-dashboard/`) |
|--------|-------------|--------------|-----------------------------|
| **DEV** | `--env-file .env.dev` (create from root `.env.example`) | `api/.env.dev` (all Laravel + Redis) | `.env.development` (Vite at build) |
| **UAT** | `--env-file .env.uat` (create from `.env.example.uat`) | `api/.env.uat` | `.env.production` (Vite at build) |
| **PROD** | `--env-file .env.prod` (create from `.env.example.prod`) | `api/.env.prod` | `.env.production` (Vite at build) |

Root `.env.dev` / `.env.uat` / `.env.prod` are **not** committed; copy from the corresponding `.env.example*` and fill in secrets.

---

## 1) Root env files (Docker Compose)

Used **only** by Docker Compose when you pass `--env-file`:

- **DEV:** `docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d`
- **UAT:** `docker compose -f docker-compose.yml -f docker-compose.uat.yml --env-file .env.uat up -d`
- **PROD:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d`

Compose uses these for:

- Variable substitution in `docker-compose.yml` (e.g. `${REDIS_PASSWORD}`, `${API_PORT}`).
- So the **Redis** container is started with `--requirepass ${REDIS_PASSWORD}` from this file.

**Templates (committed):**

- `.env.example` → copy to `.env.dev` for local dev.
- `.env.example.uat` → copy to `.env.uat` for UAT.
- `.env.example.prod` → copy to `.env.prod` for production.

**Do not commit:** `.env.dev`, `.env.uat`, `.env.prod` (real secrets).

---

## 2) API env files (`api/`)

Laravel and the API containers read from these via `env_file` in Compose:

| Compose mode | Services using it | File |
|--------------|--------------------|------|
| Base only | postgres, redis, api, queue, outbox, exporters | `api/.env` |
| **DEV** override | api, queue, outbox, postgres_exporter, redis_exporter, etc. | `api/.env.dev` |
| **UAT** override | api, queue, outbox, exporters | `api/.env.uat` |
| **PROD** override | api, queue, outbox, exporters | `api/.env.prod` |

When you run **DEV** with the dev override:

- **api, queue, outbox** use **`api/.env.dev`** (overrides base).
- **postgres** and **redis** containers still use **`api/.env`** from the base file (their `env_file` is not overridden in `docker-compose.dev.yml`).

So for DEV you typically need:

- **Root** `.env.dev` (for Compose substitution, including `REDIS_PASSWORD` for the Redis command).
- **`api/.env.dev`** (for Laravel: DB, Redis, session, app key, etc.).

### Using Redis from Docker (important for login/session speed)

The API service is forced to use the Redis container by Compose:

- In `docker-compose.yml` (and overrides), the **api** service has `environment: REDIS_HOST: redis`.
- So Laravel always talks to the `redis` service on the Docker network.

For that connection to work:

1. **`api/.env.dev`** (or whichever env file the api service uses) must have:
   - `REDIS_HOST=redis` (already set in dev override via env_file; Compose also sets it explicitly).
   - **`REDIS_PASSWORD`** equal to the password Redis is started with.

2. Redis is started with `--requirepass ${REDIS_PASSWORD}` and `${REDIS_PASSWORD}` comes from the **root** env file you pass to Compose (e.g. `.env.dev`).

So:

- **Root** `.env.dev`: `REDIS_PASSWORD=devredis123` (or your choice).
- **`api/.env.dev`**: `REDIS_PASSWORD=devredis123` (same value), plus `SESSION_DRIVER=redis`, `SESSION_CONNECTION=session`, and `REDIS_*` as in `api/.env.example`.

If `REDIS_PASSWORD` in `api/.env.dev` does not match the Redis password, Laravel cannot connect to Redis; session and cache fall back or fail and login can be very slow (e.g. 3–8+ seconds for csrf-cookie, login, me).

**Template (committed):** `api/.env.example` — copy to `api/.env` or `api/.env.dev` and set values (including `REDIS_PASSWORD` to match root when using Docker).

---

## 3) Dashboard env files (`iot-dashboard/`)

Vite reads these **at build time**; Compose does not inject them at runtime:

- **Development:** `.env.development` (e.g. `VITE_USE_MOCK`, `VITE_API_BASE_URL`).
- **UAT/Production build:** `.env.production` (e.g. `VITE_API_BASE_URL=/api`).

**Template (committed):** `iot-dashboard/.env.example` — copy to `.env.development` (or adjust for your environment).

For UAT/PROD, the image is built with `.env.production`; no separate `.env.uat` is required in the dashboard (use `.env.production` and set `VITE_API_BASE_URL` as needed).

---

## 4) Env files to keep vs remove

**Keep (in repo):**

- Root: `.env.example`, `.env.example.uat`, `.env.example.prod` (templates).
- API: `api/.env.example` (template).
- Dashboard: `iot-dashboard/.env.example` (template).

**Create locally / in CI (do not commit):**

- Root: `.env.dev`, `.env.uat`, `.env.prod`.
- API: `api/.env` or `api/.env.dev`, `api/.env.uat`, `api/.env.prod` (as needed for the mode you run).

**Safe to remove if you do not need them:**

- `iot-dashboard/.env.uat` — UAT builds use `.env.production`; this file is redundant unless you use it for a custom UAT build script.

---

## 5) Verify API is using Docker Redis

1. Start stack (e.g. dev):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d
   ```
2. Ensure root `.env.dev` and `api/.env.dev` have the same `REDIS_PASSWORD`.
3. Check API env inside the container:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev exec api env | grep REDIS
   ```
   You should see `REDIS_HOST=redis` and `REDIS_PASSWORD=<your-password>`.
4. Test Redis from the API container:
   ```bash
   docker compose exec api php artisan tinker --execute="echo Illuminate\Support\Facades\Redis::connection('session')->ping();"
   ```
   Should print `1` (or similar) if the session Redis connection works.

After fixing `REDIS_PASSWORD` and using Redis for sessions, csrf-cookie, login, and `/auth/me` should drop to well under a second in normal conditions.

---

## 6) GET /auth/me response format

`GET /auth/me` returns **plain JSON** (not encrypted). Security is handled by: (1) HTTPS in production, (2) returning the payload only when the request has a valid session cookie, (3) exposing only safe fields via `UserResource` (e.g. `id` as uuid, name, email, company, role — no password or tokens). The frontend needs the decoded user object to render the UI; body encryption is not used unless you add a specific requirement.
