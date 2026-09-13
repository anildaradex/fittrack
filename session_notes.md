# FitTrack — session notes (newest first)

## 2026-09-13 (later) — Phase 0 scaffold + GCP project
- Decisions from user: region **us-central1** (cheapest Tier 1 near Dallas; us-south1 is Tier 2), **Apple Health calories-burned sync required** → Phase 5 via iOS Shortcut automation → `/api/health/import` (PWA can't read HealthKit).
- Built: `backend/` (FastAPI, pydantic-settings, `/api/health`, SPA fallback serving `static/`), `frontend/` (Vite React TS shell showing API status), `Dockerfile`, `cloudbuild.yaml`, `.gitignore`, `.gcloudignore`, README, `.claude/launch.json` (fittrack-api on 8020). Local e2e verified: health JSON, index, assets, SPA route.
- git init on `main`, first commit 489aa39.
- Installed `gh` 2.100.0. Auto-mode blocked authenticating gh from the keychain token → user step.
- Created GCP project `fittrack-prod-anildara`. Billing link failed: acct 01BA1E is closed; two open accounts exist → user step.
- Carry-forward: billing choice, gh auth / repo creation, then finish pipeline (see handoff.md).

## 2026-09-13 — Project kickoff
- User asked for a personal MyFitnessPal clone, built incrementally, deployed to their Google Cloud, code on GitHub.
- Wrote PLAN.md: scope table, architecture (single Cloud Run container: FastAPI + React PWA, Cloud SQL Postgres), data model (per-100 g nutrition), 8 phases (0 = pipeline first), cost (~$9/mo, Cloud SQL is the only real line), open decisions.
- Stack chosen to match MedIQ/NuroQ habits. Food data: USDA FoodData Central + Open Food Facts; auth: Firebase Google sign-in with email allowlist.
- Carry-forward: user to confirm region / DB / repo name defaults, then start Phase 0.
