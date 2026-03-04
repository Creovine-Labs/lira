#!/usr/bin/env bash
# ── Lira AI — manual Vercel deploy ───────────────────────────────────────────
# Usage:  ./deploy.sh
#
# Builds the frontend locally and pushes the prebuilt output to Vercel
# production.  Does NOT rely on GitHub ↔ Vercel integration.
# ────────────────────────────────────────────────────────────────────────────
set -e

echo "▶ Installing dependencies (if needed)…"
npm install --silent

echo "▶ Building for production…"
npm run build

echo "▶ Preparing Vercel output…"
vercel build --prod

echo "▶ Deploying to Vercel production…"
vercel deploy --prebuilt --prod

echo "✅  Deploy complete → https://lira.creovine.com"
