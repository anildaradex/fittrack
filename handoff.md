# FitTrack — handoff (cold-start context)

**What:** personal MyFitnessPal clone (calorie/macro/weight tracker). PWA + FastAPI, one Cloud Run
service, Postgres. Plan: `PLAN.md` (phases 0–7). Single user (owner email allowlist). Apple Health calories-burned sync is a required feature (Phase 5, iOS Shortcut → /api/health/import).

**Status (2026-09-13, Phase 0 in progress):** scaffold DONE and committed locally (backend FastAPI
`/api/health` + SPA static serving, tests pass; frontend Vite React shell builds; Dockerfile multi-stage;
cloudbuild.yaml = tests → build → push → `gcloud run deploy`). GCP project `fittrack-prod-anildara`
(#771990849353) CREATED but **billing not linked**: old acct 01BA1E-327DEC-07880A is CLOSED (all other
prod projects are on it with billing disabled); open accounts are 019ADC-AB4154-A80CCC (has
gen-lang-client-0581839307) and 01A432-DD3A99-945874 (empty) — user must choose. GitHub repo NOT created:
`gh` installed (brew) but auto-mode blocked piping the keychain token into `gh auth login`; user must run
`gh auth login` (or create repo `anildaradex/fittrack` in the browser), then `git push`.
Next after unblock: link billing → enable run/cloudbuild/artifactregistry/secretmanager/sqladmin →
`gcloud artifacts repositories create fittrack --location=us-central1` → IAM for Cloud Build SA
(run.admin, artifactregistry.writer, logging.logWriter, iam.serviceAccountUser on compute SA) →
Cloud Build GitHub connection + trigger on main → first build.

**Conventions (from sibling projects):** GitHub org `anildaradex`, GCP project `fittrack-prod-anildara`,
region us-central1 (cheapest US, near Dallas), billing acct 01BA1E-327DEC-07880A, secrets in Secret Manager, FastAPI serves
the built frontend, `uv` for Python, Node 22. No docker / gh / terraform installed locally.

**Gotchas:** auto-mode blocks direct `gcloud run deploy` on prod → deploy via Cloud Build trigger on
push to main. Cloud Build ↔ GitHub connection is a one-time console step for the user.
Local dev DB = SQLite (no docker); prod = Cloud SQL Postgres; migrations must work on both.
Ports in use by other projects: 8000 (NuroQ), 8011 (MedIQ) — use 8020 here.

**Key files:** PLAN.md, handoff.md, session_notes.md (backend/, frontend/, Dockerfile, cloudbuild.yaml
arrive in Phase 0).
