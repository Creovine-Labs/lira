# ADR 0001: Frontend Module Boundaries

- Status: Accepted
- Date: 2026-02-23

## Context

## Decision

Adopt a layered module structure under `src/`:

- `app/`: composition root (router, providers, store wiring)
- `components/`: reusable UI and shared visual building blocks
- `features/`: domain-focused slices (`meeting`, `participants`, `ai-participant`, `settings`)
- `services/`: IO and external integrations (websocket, webrtc, audio, api)
- `hooks/`, `lib/`, `types/`, `styles/`, `pages/`, `test/`: cross-cutting support modules

Each top-level layer exposes a barrel entrypoint (`index.ts`) and should be imported through aliases.

## Consequences

- Predictable import graph and ownership model
- Lower coupling between feature code and infrastructure code
- Faster onboarding for new contributors
