# IoT Monitoring — Docker Infrastructure

Multi-environment Docker Compose setup with full observability.

## Stack Versions

| Service | Image | Version |
|---|---|---|
| PostgreSQL | `postgres` | 18-alpine |
| Redis | `redis` | 8.0-alpine |
| Mosquitto | `eclipse-mosquitto` | 2.0.22 |
| Prometheus | `prom/prometheus` | v3.4.0 |
| Grafana | `grafana/grafana` | 12.0.1 |
| Loki | `grafana/loki` | 3.5.0 |
| Alloy | `grafana/alloy` | v1.8.3 |
| Alertmanager | `prom/alertmanager` | v0.28.1 |
| Node Exporter | `prom/node-exporter` | v1.9.1 |
| cAdvisor | `gcr.io/cadvisor/cadvisor` | v0.52.1 |
| Postgres Exporter | `prometheuscommunity/postgres-exporter` | v0.17.1 |
| Redis Exporter | `oliver006/redis_exporter` | v1.73.0 |
| Mosquitto Exporter | `sapcc/mosquitto-exporter` | 0.8.0 |
| Caddy (prod) | `caddy` | 2.10-alpine |

---

## File Structure

```
docker-compose.yml          ← Base (shared services)
docker-compose.dev.yml      ← Dev overrides (hot-reload, mocks, debug)
docker-compose.uat.yml      ← UAT overrides (built images, staging config)
docker-compose.prod.yml     ← Prod overrides (hardened, TLS, resource limits)

.env.dev                    ← Dev secrets template
.env.uat                    ← UAT secrets template
.env.prod                   ← Prod secrets template (never commit filled values)

Makefile                    ← Shortcuts (make dev, make logs, etc.)

observability/
  prometheus/
    prometheus.yml           ← Scrape configs for all services
    rules/alerts.yml         ← Alerting rules (infra, DB, API, MQTT)
  grafana/
    provisioning/
      datasources/           ← Auto-provisions Prometheus + Loki
      dashboards/            ← Dashboard folder loader
    dashboards/              ← Drop .json dashboard files here
  loki/
    loki-config.yml          ← Loki 3.x filesystem storage config
  alloy/
    alloy-config.alloy       ← Docker log collection → Loki
  alertmanager/
    alertmanager.yml         ← Alert routing (Slack, email)

infra/
  caddy/Caddyfile            ← Production TLS reverse proxy
  postgres/init.sql          ← DB init script
  mosquitto/mosquitto.conf   ← MQTT broker config
```

---

## Quick Start

### Development

```bash
cp .env.dev .env
make dev
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| API | http://localhost:8000 |
| Grafana | http://localhost:3000 (anonymous admin in dev) |
| Prometheus | http://localhost:9090 |
| Alertmanager | http://localhost:9093 |
| Mailpit | http://localhost:8025 |

### UAT

```bash
cp .env.uat .env
# Fill in all REPLACE_ values
make uat
```

### Production

```bash
cp .env.prod .env
# Fill in all REPLACE_ values via your secret manager
# Update infra/caddy/Caddyfile with your real domains
make prod
```

---

## Observability Architecture

```
All containers
     │ stdout/stderr
     ▼
  Grafana Alloy  ──────────────────────► Loki (log storage)
     │ metrics                               │
     ▼                                       │
  Prometheus ◄── exporters                  │
     │ (postgres, redis,                     │
     │  mosquitto, node,                     │
     │  cadvisor, api)                       │
     │                                       │
     ▼                                       ▼
  Alertmanager                           Grafana
     │                                  (dashboards,
     ▼                                   explore logs)
  Slack / Email
```

### Metrics coverage
- **API**: HTTP request rate, error rate, latency (p50/p95/p99)
- **PostgreSQL**: connections, query duration, locks, replication lag
- **Redis**: memory, evictions, hit rate, connected clients
- **Mosquitto**: connected clients, messages in/out, bytes in/out
- **Host**: CPU, memory, disk, network (via node_exporter)
- **Containers**: CPU, memory, network per container (via cAdvisor)

### Logs coverage
- All Docker container stdout/stderr → Loki via Alloy
- System `/var/log/*.log` → Loki via Alloy

---

## Adding Grafana Dashboards

Download community dashboards from [grafana.com/dashboards](https://grafana.com/grafana/dashboards/) and drop the `.json` files in:

```
observability/grafana/dashboards/
```

Recommended dashboard IDs:
- **1860** — Node Exporter Full
- **14114** — PostgreSQL Database
- **763** — Redis Dashboard
- **179** — Docker + cAdvisor
- **13639** — Loki Logs

---

## Useful Commands

```bash
make logs SERVICE=api          # tail API logs
make shell-api                 # shell into API container
make shell-db                  # psql into postgres
make migrate                   # run Laravel migrations
make reload-prometheus         # hot-reload Prometheus config
make help                      # show all commands
```

---

## Security Notes

- All secrets use `${VAR:?required}` — Compose **fails fast** if any are missing
- Production exposes **no ports directly** — everything goes through Caddy with TLS
- Prometheus and Alertmanager are IP-restricted + basic-auth protected in production
- Grafana anonymous access is disabled in UAT and prod
- Redis requires password auth in all envs
- `SESSION_SECURE_COOKIE=true` is enforced in production