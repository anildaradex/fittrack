# FitTrack — handoff (cold-start context)

**What:** personal MyFitnessPal clone (calorie/macro/weight tracker). PWA + FastAPI, one Cloud Run
service, Postgres. Plan: `PLAN.md` (phases 0–7). Single user (owner email allowlist). Apple Health calories-burned sync is a required feature (Phase 5, iOS Shortcut → /api/health/import).

**Status (2026-09-13):** plan written, nothing built yet. Next: Phase 0 (scaffold + GitHub + GCP
project + Cloud Build trigger → hello world on Cloud Run).

**Conventions (from sibling projects):** GitHub org `anildaradex`, GCP project `fittrack-prod-anildara`,
region us-central1 (cheapest US, near Dallas), billing acct 01BA1E-327DEC-07880A, secrets in Secret Manager, FastAPI serves
the built frontend, `uv` for Python, Node 22. No docker / gh / terraform installed locally.

**Gotchas:** auto-mode blocks direct `gcloud run deploy` on prod → deploy via Cloud Build trigger on
push to main. Cloud Build ↔ GitHub connection is a one-time console step for the user.
Local dev DB = SQLite (no docker); prod = Cloud SQL Postgres; migrations must work on both.
Ports in use by other projects: 8000 (NuroQ), 8011 (MedIQ) — use 8020 here.

**Key files:** PLAN.md, handoff.md, session_notes.md (backend/, frontend/, Dockerfile, cloudbuild.yaml
arrive in Phase 0).
