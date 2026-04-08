#!/bin/bash
# api/docker-entrypoint.dev.sh
# Runs at container start in development. Every step is idempotent — safe to re-run.
set -e

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│  SmartIoT API — dev entrypoint                  │"
echo "└─────────────────────────────────────────────────┘"
echo ""

# ── 1. Composer dependencies (including dev — needed for tests, Faker, etc.) ──
echo "▶  Installing Composer dependencies..."
composer install --no-interaction --prefer-dist
echo ""

# ── 2. Ensure required storage directories exist (gitignored, absent on fresh clone) ──
echo "▶  Ensuring storage directories exist..."
mkdir -p \
    storage/framework/views \
    storage/framework/cache \
    storage/framework/sessions \
    storage/logs \
    bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
echo ""

# ── 4. APP_KEY safety net — generate only if genuinely missing ────────────────
if [ -z "${APP_KEY}" ]; then
    echo "▶  APP_KEY is not set — generating one now..."
    echo "   (In dev this should be pre-set in api/.env.dev — check your env_file.)"
    php artisan key:generate --force
else
    echo "▶  APP_KEY present."
fi

# ── 5. Run pending migrations ─────────────────────────────────────────────────
echo "▶  Running migrations..."
php artisan migrate --force
echo ""

# ── 6. Auto-seed if database is empty ────────────────────────────────────────
# Safety net: if the pgdata volume was reset (Docker Desktop on Windows can do
# this silently), this brings the dev DB back to a usable state automatically.
echo "▶  Checking database state..."
USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null | tail -1 | tr -d ' \n\r\t')
if [ "$USER_COUNT" = "0" ]; then
    echo "   Database is empty — running seeders automatically..."
    php artisan db:seed --no-interaction
    echo "   ✔  Auto-seeded."
elif echo "$USER_COUNT" | grep -qE '^[0-9]+$'; then
    echo "   Database has data (${USER_COUNT} users) — skipping seed."
else
    echo "   Could not determine database state — skipping auto-seed."
fi
echo ""

# ── 8. Clear stale caches — non-fatal: if nothing is cached, artisan exits 1 ──
echo "▶  Clearing caches..."
php artisan config:clear || true
php artisan route:clear  || true
php artisan view:clear   || true
echo ""

echo "✔  Startup complete. Starting: $*"
echo ""

exec "$@"
