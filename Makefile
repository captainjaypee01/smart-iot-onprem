# Makefile — IoT Monitoring Stack shortcuts
# Usage: make dev | make uat | make prod | make down | make logs SERVICE=api

.PHONY: dev uat prod stop down logs ps restart migrate seed shell-api shell-db test-api

# ── Compose helpers ────────────────────────────────────────────────────────────
DEV_COMPOSE  = docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev
UAT_COMPOSE  = docker compose -f docker-compose.yml -f docker-compose.uat.yml --env-file .env.uat
PROD_COMPOSE = docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod

dev: ## Start development stack (auto-migrates on first run)
	$(DEV_COMPOSE) up -d --build
	@echo ""
	@echo "Dev stack starting..."
	@echo "  Dashboard : http://localhost:5173"
	@echo "  API       : http://localhost:8000"
	@echo "  Mailpit   : http://localhost:8025"
	@echo "  Grafana   : http://localhost:3200"
	@echo ""
	@echo "First time? Run: make seed"
	@echo "To tail API logs: make logs SERVICE=api"
	@echo ""

setup: ## First-time dev setup — starts stack, waits for API, then seeds DB
	$(DEV_COMPOSE) up -d --build
	@echo "Waiting for API to be healthy..."
	@$(DEV_COMPOSE) exec -T api sh -c 'until curl -fsS http://localhost:8000/api/v1/health >/dev/null 2>&1; do sleep 2; done'
	@echo "Seeding database..."
	$(DEV_COMPOSE) exec api php artisan db:seed
	@echo ""
	@echo "Setup complete!"
	@echo "  Dashboard : http://localhost:5173"
	@echo "  API       : http://localhost:8000"
	@echo "  Mailpit   : http://localhost:8025 (catches all dev emails)"
	@echo ""

uat: ## Start UAT stack
	$(UAT_COMPOSE) up -d --build
	@echo "🧪 UAT stack up"

prod: ## Start production stack
	$(PROD_COMPOSE) up -d --build
	@echo "🏭 Production stack up"

stop: ## Pause dev containers without removing them (volumes stay intact, faster restart)
	$(DEV_COMPOSE) stop

down: ## Remove dev containers + networks (volumes are preserved — data is safe)
	@case "$(ENV)" in \
	  uat)  $(UAT_COMPOSE) down ;; \
	  prod) $(PROD_COMPOSE) down ;; \
	  *)    $(DEV_COMPOSE) down ;; \
	esac

# ── Logs ───────────────────────────────────────────────────────────────────────
logs: ## Tail logs. Usage: make logs SERVICE=api
	$(DEV_COMPOSE) logs -f $(SERVICE)

ps: ## Show running containers
	$(DEV_COMPOSE) ps

# ── Database ───────────────────────────────────────────────────────────────────
migrate: ## Run pending migrations. ENV=dev (default) | uat | prod
	@case "$(ENV)" in \
	  uat)  $(UAT_COMPOSE)  exec api php artisan migrate --force ;; \
	  prod) $(PROD_COMPOSE) exec api php artisan migrate --force ;; \
	  *)    $(DEV_COMPOSE)  exec api php artisan migrate ;; \
	esac

migrate-fresh: ## Drop all tables + re-migrate + seed. DEV ONLY — never run against UAT or prod.
	@if [ "$(ENV)" = "uat" ] || [ "$(ENV)" = "prod" ]; then \
	  echo ""; \
	  echo "  ERROR: migrate-fresh is blocked for ENV=$(ENV)."; \
	  echo "  It drops every table. Use 'make migrate' to apply pending migrations safely."; \
	  echo ""; \
	  exit 1; \
	fi
	@echo ""
	@echo "  WARNING: This will DROP ALL TABLES and re-seed the dev database."
	@echo "  Press Ctrl+C to cancel, or Enter to continue."
	@read _CONFIRM
	$(DEV_COMPOSE) exec api php artisan migrate:fresh --seed

seed: ## Run database seeders (dev)
	$(DEV_COMPOSE) exec api php artisan db:seed

# ── Testing ────────────────────────────────────────────────────────────────────
test-api: ## Run API test suite (uses in-memory SQLite — never touches dev DB)
	$(DEV_COMPOSE) exec api composer test

# ── Shell access ───────────────────────────────────────────────────────────────
shell-api: ## Shell into API container
	$(DEV_COMPOSE) exec api sh

shell-db: ## psql into postgres container
	$(DEV_COMPOSE) exec postgres psql -U $${POSTGRES_USER:-iot} -d $${POSTGRES_DB:-iot}

shell-redis: ## redis-cli into redis container
	$(DEV_COMPOSE) exec redis redis-cli -a $${REDIS_PASSWORD}

# ── Observability ──────────────────────────────────────────────────────────────
reload-prometheus: ## Hot-reload Prometheus config
	curl -fsS -X POST http://localhost:9090/-/reload && echo "Prometheus reloaded"

# ── Helpers ────────────────────────────────────────────────────────────────────
gen-key: ## Generate a new Laravel APP_KEY
	docker run --rm php:8.4-cli php -r "echo 'base64:' . base64_encode(random_bytes(32)) . PHP_EOL;"

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
