#!/bin/bash
# api/docker-entrypoint.prod.sh
# Runs at container start in UAT and production.
# SAFE ONLY — runs pending migrations, never drops or seeds.
set -e

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│  SmartIoT API — production entrypoint           │"
echo "└─────────────────────────────────────────────────┘"
echo ""

# ── 1. Run pending migrations (additive only — never migrate:fresh) ───────────
# New migration files added since the last deploy are applied here.
# Existing migrations are skipped (already in the migrations table).
echo "▶  Running pending migrations..."
php artisan migrate --force
echo ""

# ── 2. Clear stale caches ─────────────────────────────────────────────────────
echo "▶  Clearing caches..."
php artisan config:clear  || true
php artisan route:clear   || true
php artisan view:clear    || true
echo ""

echo "✔  Startup complete. Starting: $*"
echo ""

exec "$@"
