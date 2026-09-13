# FitTrack — handoff (cold-start context)

**What:** personal MyFitnessPal clone (calorie/macro/weight tracker). PWA + FastAPI, one Cloud Run
service, Postgres. Plan: `PLAN.md` (phases 0–7). Single user (owner email allowlist). Apple Health calories-burned sync is a required feature (Phase 5, iOS Shortcut → /api/health/import).

**Status (2026-09-13): Phase 1 LIVE.** https://fittrack-kveakx2baa-uc.a.run.app — token login, diary,
custom foods, goals. Repo https://github.com/anildaradex/fittrack; push to main auto-deploys (Cloud Build
trigger `deploy-main`). GCP `fittrack-prod-anildara` (#771990849353), us-central1, billing 01BA1E.
Cloud SQL `fittrack-db` (Postgres 16, db-f1-micro) ↔ Cloud Run via `/cloudsql` socket; secrets
`database-url`, `fittrack-app-token` (Secret Manager, runtime SA has accessor). Sign-in token:
`gcloud secrets versions access latest --secret=fittrack-app-token --project=fittrack-prod-anildara`.
Migrations run at container start (`alembic upgrade head`). Manual deploy fallback:
`gcloud builds submit --config cloudbuild.yaml --region us-central1 --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)`.
**Next: Phase 2** — USDA FoodData Central search/import (needs free API key → Secret Manager `usda-api-key`),
Open Food Facts barcode lookup, cache into `foods` (source=usda|off, owner null).

**Conventions (from sibling projects):** GitHub org `anildaradex`, GCP project `fittrack-prod-anildara`,
region us-central1 (cheapest US, near Dallas), billing acct 01BA1E-327DEC-07880A, secrets in Secret Manager, FastAPI serves
the built frontend, `uv` for Python, Node 22. No docker / gh / terraform installed locally.

**Gotchas:** auto-mode blocks direct `gcloud run deploy` on prod → deploy via Cloud Build trigger on
push to main. Cloud Build ↔ GitHub connection is a one-time console step for the user.
Local dev DB = SQLite (no docker); prod = Cloud SQL Postgres; migrations must work on both.
Ports in use by other projects: 8000 (NuroQ), 8011 (MedIQ) — use 8020 here.

**Key files:** backend/app/{models,schemas,auth,config,db}.py, backend/app/routers/{foods,goals,diary}.py,
backend/migrations/, backend/tests/; frontend/src/{api.ts,types.ts,App.tsx}, frontend/src/pages/,
frontend/src/components/LogSheet.tsx; Dockerfile, cloudbuild.yaml, scripts/setup_trigger.sh.
**Dev:** Claude Preview launch config `fittrack-api` (workspace-root .claude/launch.json) serves backend +
built frontend on :8020 (SQLite backend/fittrack.db, token `dev-token`); `cd frontend && npm run build` first.
**Design rules:** nutrition per 100 g everywhere; FoodForm takes per-serving input and converts; soft-delete
foods; goals are append-only history (latest effective_from wins).
