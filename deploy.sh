#!/usr/bin/env bash
# ── Lira AI — manual Vercel deploy ───────────────────────────────────────────
# Usage:  ./deploy.sh
#
# Builds the frontend locally and pushes the prebuilt output to Vercel
# production.  Does NOT rely on GitHub ↔ Vercel integration.
#
# NOTE: .env.local (localhost dev overrides) is temporarily hidden during the
# build so Vite uses the production values from .env instead.
# ────────────────────────────────────────────────────────────────────────────
set -e

# Hide .env.local so it doesn't override production API URLs during build
if [ -f .env.local ]; then
  mv .env.local .env.local.deploy_bak
  trap 'mv .env.local.deploy_bak .env.local' EXIT
fi

echo "▶ Installing dependencies (if needed)…"
npm install --silent

echo "▶ Building for production…"
npm run build

echo "▶ Preparing Vercel output…"
vercel build --prod

# Restore .env.local before deploy step (trap handles crashes too)
if [ -f .env.local.deploy_bak ]; then
  mv .env.local.deploy_bak .env.local
  trap - EXIT
fi

echo "▶ Deploying to Vercel production…"
vercel deploy --prebuilt --prod

echo "✅  Deploy complete → https://lira.creovine.com"
