# OPS-NOTES.md — Docker Ops Notes (Smart IoT On-Prem)

This file documents the operational commands and safety rules for the on-prem Docker stack.

Your stack (current):
- Core: Postgres 18, Redis 8.4, Mosquitto 2.0.22, Laravel API (PHP image built via `api/Dockerfile`)
- Observability (profile `obs`): Prometheus, Grafana, Loki, Alloy, exporters (Postgres/Redis/Mosquitto)

---

## 1) Core Concepts (READ ONCE)

### Containers vs Images vs Volumes
- **Image**: software snapshot (e.g., `postgres:18-alpine`)
- **Container**: a running instance of an image (e.g., `iot-postgres`)
- **Volume**: persistent storage (this is where your data lives)

### Data Safety Rule
- **Your Postgres data is in the `pgdata` volume**.
- **Your Mosquitto persistence is in `mosquitto_data` and `mosquitto_log` volumes**.
- **Your monitoring data is in `prometheus_data`, `grafana_data`, `loki_data` volumes**.

✅ Safe actions: restart containers, rebuild API image, pull images (same major), recreate containers  
❌ Dangerous action: remove volumes (wipes data)

---

## 2) Files & Environment (How to Avoid Leaking Secrets)

### Files you commit
- `docker-compose.yml` (uses `${VAR}` placeholders)
- `.env.example` (template values, non-secret)
- docs configs (Prometheus/Grafana/Loki/Alloy config files)

### Files you never commit
- `.env` (real values, passwords, tokens, APP_KEY, exporter DSN)
- any generated secrets

### Compose env substitution
Docker Compose reads variables from:
- a root `.env` file (same folder as compose), and/or
- your shell environment

**`.env.example` is NOT auto-loaded.** Copy it to `.env` locally.

---

## 3) Safe Daily Commands (No Data Loss)

### Start all core services (safe)
```bash
docker compose up -d
```

### Start observability services too (safe)
```bash
docker compose --profile obs up -d
```

### Check status
```bash
docker compose ps
```

### Follow logs (all)
```bash
docker compose logs -f
```

### Show last N log lines for a specific service
```bash
docker compose logs -n 200 postgres
docker compose logs -n 200 api
docker compose logs -n 200 mosquitto
docker compose logs -n 200 prometheus
docker compose logs -n 200 grafana
```

### Restart (safe; keeps volumes)
```bash
docker compose restart
docker compose restart api
docker compose restart postgres
```

---

## 4) Rebuild / Update Without Losing Data

### Rebuild API image after changing `api/Dockerfile` (safe)
```bash
docker compose build api --no-cache
docker compose up -d api
```
**Note:** Only rebuilds the API container. Postgres data stays in `pgdata`.

### Pull updated images (safe if same major versions)
```bash
docker compose pull
docker compose up -d
```

### Force recreate one service to apply new environment variables (safe)
Example: exporter DSN changed:
```bash
docker compose up -d --force-recreate postgres_exporter
docker compose logs -n 100 postgres_exporter
```

### See resolved config after env substitution (debug)
```bash
docker compose config
```
**Tip:** Search in output for `DATA_SOURCE_NAME`, `POSTGRES_DB`, etc.

---

## 5) Commands That Wipe Data (USE WITH EXTREME CARE)

### Stop containers but keep volumes (safe)
```bash
docker compose down
```

### Stop containers AND remove volumes (DATA WIPE)
```bash
docker compose down -v
```
This deletes:
- Postgres data: `pgdata`
- Mosquitto persistence: `mosquitto_data`, `mosquitto_log`
- Monitoring data: `prometheus_data`, `grafana_data`, `loki_data`

Only use `-v` if you intentionally want a fresh environment.

---

## 6) Database Management

### List databases
```bash
docker exec -it iot-postgres psql -U "${POSTGRES_USER:-iot}" -d postgres -c "\l"
```

### Create DB manually (if needed)
```bash
docker exec -it iot-postgres psql -U "${POSTGRES_USER:-iot}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB:-iot} OWNER ${POSTGRES_USER:-iot};"
```

### Verify DB connectivity
```bash
docker exec -it iot-postgres psql -U "${POSTGRES_USER:-iot}" -d "${POSTGRES_DB:-iot}" -c "select now();"
```

---

## 7) Smoke Tests (Verify Core Dependencies)

### Redis
```bash
docker exec -it iot-redis redis-cli ping
```
Expected: `PONG`

### MQTT Broker (two terminals)
Terminal A (subscriber):
```bash
docker exec -it iot-mosquitto sh -lc "mosquitto_sub -h localhost -t test/topic -v"
```

Terminal B (publisher):
```bash
docker exec -it iot-mosquitto sh -lc "mosquitto_pub -h localhost -t test/topic -m hello"
```

---

## 8) Observability (Prometheus/Grafana/Loki/Alloy)

### Start observability stack
```bash
docker compose --profile obs up -d
```

### Open UIs (from host)
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Loki: http://localhost:3100
- Alloy UI: http://localhost:12345

### Exporter endpoints (from host)
- Postgres exporter: http://localhost:9187/metrics
- Redis exporter: http://localhost:9121/metrics
- Mosquitto exporter: http://localhost:9234/metrics

**Important Note (Prometheus UI target links):**
Prometheus may display internal Docker hostnames (like `postgres_exporter:9187`) which your browser cannot resolve.
If you want to view raw metrics in a browser, use `localhost:<port>`.

### Verify Prometheus can reach exporters (from inside the Prometheus container)
```bash
docker exec -it iot-prometheus sh -lc "wget -qO- http://postgres_exporter:9187/metrics | head"
docker exec -it iot-prometheus sh -lc "wget -qO- http://redis_exporter:9121/metrics | head"
docker exec -it iot-prometheus sh -lc "wget -qO- http://mosquitto_exporter:9234/metrics | head"
```

### Postgres exporter DSN (important)
In your compose you use:
```yaml
DATA_SOURCE_NAME: ${POSTGRES_EXPORTER_DSN}
```

So you MUST set `POSTGRES_EXPORTER_DSN` in your root `.env` (gitignored), e.g.:
```env
POSTGRES_EXPORTER_DSN=postgresql://iot:change-me@postgres:5432/iot?sslmode=disable
```

If you change DSN, recreate the exporter:
```bash
docker compose up -d --force-recreate postgres_exporter
docker compose logs -n 100 postgres_exporter
```

---

## 9) Laravel API Operations

### Clear cached config after editing `api/.env`
```bash
docker compose exec api php artisan config:clear
docker compose exec api php artisan cache:clear
docker compose restart api
```

### Generate APP_KEY ONCE (don’t do it every restart)
Generate from inside container:
```bash
docker compose exec api php artisan key:generate --show
```
Copy the output into your root `.env`:
```env
APP_KEY=base64:...
```
Then restart API:
```bash
docker compose restart api
```

**Do NOT** run `php artisan key:generate --force` on every container start.
It can break encrypted values and sessions.

---

## 10) Upgrading Versions Without Breaking Data

### Safe upgrades (usually)
- API image rebuild: safe (no DB changes)
- Redis/Mosquitto minor updates: usually safe
- Postgres minor updates within major 18: usually safe

### Postgres major upgrade rule (CRITICAL)
If you change Postgres major version (example 16 -> 18), you MUST migrate.
Otherwise Postgres will fail to start with “incompatible database files”.

#### Recommended major upgrade process: dump -> new volume -> restore
1) Ensure old Postgres is running
```bash
docker compose up -d postgres
```

2) Dump DB to host file
```bash
docker exec -t iot-postgres pg_dump -U "${POSTGRES_USER:-iot}" -d "${POSTGRES_DB:-iot}" > db_dump.sql
```

3) Change compose to new Postgres version AND new volume name (so old volume remains as rollback)
Example: change volume name from `pgdata` to `pgdata18` temporarily.

4) Start new Postgres (fresh volume)
```bash
docker compose up -d postgres
docker compose logs -n 200 postgres
```

5) Restore
```bash
cat db_dump.sql | docker exec -i iot-postgres psql -U "${POSTGRES_USER:-iot}" -d "${POSTGRES_DB:-iot}"
```

6) Start everything
```bash
docker compose up -d
```

### Early development shortcut (ONLY if you don’t need data)
```bash
docker compose down -v
docker compose up -d
```
This wipes everything and reinitializes the DB and monitoring storage.

---

## 11) Recommended Rollback Pattern

If an upgrade breaks:
1) revert the image tag in `docker-compose.yml`
2) restart:
```bash
docker compose up -d
```
3) check logs:
```bash
docker compose logs -n 200 <service>
```

As long as you did NOT run `docker compose down -v`, your volumes/data remain and rollback is quick.

---
### Small suggestion (optional, but helpful)
Add a `.env.example` in root that includes **all** the variables you use now:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`
- `REDIS_PORT`
- `MQTT_PORT`, `MQTT_WS_PORT`
- `API_PORT`, `APP_ENV`, `APP_DEBUG`, `APP_KEY`
- `POSTGRES_EXPORTER_DSN`
- `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`

This makes onboarding smoother for future you / teammates.