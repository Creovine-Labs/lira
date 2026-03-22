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

# Hide large .mov source files so they don't bloat the Vercel upload (>2 GiB limit)
MOV_TMPDIR=$(mktemp -d)
MOV_FILES=()
for f in public/participants/*.mov; do
  [ -f "$f" ] || continue
  mv "$f" "$MOV_TMPDIR/"
  MOV_FILES+=("$f")
done
if [ ${#MOV_FILES[@]} -gt 0 ]; then
  trap '
    for f in "${MOV_FILES[@]}"; do mv "$MOV_TMPDIR/$(basename $f)" "$f" 2>/dev/null || true; done
    rm -rf "$MOV_TMPDIR"
    [ -f .env.local.deploy_bak ] && mv .env.local.deploy_bak .env.local || true
  ' EXIT
fi

echo "▶ Installing dependencies (if needed)…"
npm install --silent

echo "▶ Building for production…"
npm run build

echo "▶ Preparing Vercel output…"
rm -rf .vercel/output
vercel build --prod

# Restore .env.local before deploy step (trap handles crashes too)
if [ -f .env.local.deploy_bak ]; then
  mv .env.local.deploy_bak .env.local
  trap - EXIT
fi

echo "▶ Deploying to Vercel production…"
vercel deploy --prebuilt --prod

echo "✅  Deploy complete → https://lira.creovine.com"
