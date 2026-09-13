# FitTrack — session notes (newest first)

## 2026-09-13 (later) — Phase 0 scaffold + GCP project
- Decisions from user: region **us-central1** (cheapest Tier 1 near Dallas; us-south1 is Tier 2), **Apple Health calories-burned sync required** → Phase 5 via iOS Shortcut automation → `/api/health/import` (PWA can't read HealthKit).
- Built: `backend/` (FastAPI, pydantic-settings, `/api/health`, SPA fallback serving `static/`), `frontend/` (Vite React TS shell showing API status), `Dockerfile`, `cloudbuild.yaml`, `.gitignore`, `.gcloudignore`, README, `.claude/launch.json` (fittrack-api on 8020). Local e2e verified: health JSON, index, assets, SPA route.
- git init on `main`, first commit 489aa39.
- Installed `gh` 2.100.0. Auto-mode blocked authenticating gh from the keychain token → user step.
- Created GCP project `fittrack-prod-anildara`. Billing link failed: acct 01BA1E is closed; two open accounts exist → user step.
- User reopened billing acct 01BA1E (other prod projects got billing back). Linking FitTrack fails: 5-project quota on that account. Candidate to unlink: `project-a963fa18-b529-48d8-870` ("My First Project", empty). Auto-mode blocked the unlink → user command.
- User created https://github.com/anildaradex/fittrack (with GitHub README). Rebased our 2 commits onto its initial commit (kept our README), pushed main.
- User unlinked "My First Project" + linked FitTrack to 01BA1E. Enabled run/cloudbuild/artifactregistry/secretmanager/sqladmin; created AR repo `fittrack`; IAM for compute SA (new-project Cloud Build default), legacy CB SA, P4SA secretmanager.admin.
- First build via `gcloud builds submit` SUCCESS (tests → build → push → deploy, 1m18s). Live: https://fittrack-kveakx2baa-uc.a.run.app — health OK, SPA route 200, screenshot verified.
- Cloud Build GitHub connection `fittrack-github` created, PENDING_USER_OAUTH. Added `scripts/setup_trigger.sh` for repo link + `deploy-main` trigger once authorized.
- User authorized the GitHub connection (COMPLETE). Linked repo; trigger `deploy-main` (^main$, cloudbuild.yaml) created — needed explicit `--service-account` (compute SA) on this new project; script fixed. This commit is the auto-deploy proof.
- Auto-deploy proven (331fb07 built by trigger, live).

## 2026-09-13 (evening) — Phase 1: diary MVP
- Backend: SQLAlchemy 2 models (users, goals, foods, food_servings, diary_entries; nutrition per 100 g), Alembic (render_as_batch for SQLite parity; `alembic upgrade head` in container CMD), bearer-token auth (`FITTRACK_APP_TOKEN`; owner row auto-created), routers foods/goals/diary. 11 pytest tests.
- Frontend: react-router; Login (token → localStorage), Today (date nav, kcal ring/bars, net-carb mode, 4 meals, tap entry → edit/delete sheet), Add (search + recent, LogSheet with serving × qty), Foods list, FoodForm (enter per-serving, stored per 100 g), Goals (presets, net-carb toggle). Verified in browser desktop + mobile.
- Bug found in browser test: Shell only re-read token on a logout event → login never advanced. Fixed with a `fittrack:auth` event from setToken.
- Cloud: Cloud SQL `fittrack-db` (POSTGRES_16, db-f1-micro, HDD 10 GB, us-central1), DB `fittrack`, user `fittrack`; secrets `database-url` (psycopg URL via /cloudsql socket) + `fittrack-app-token`; cloudbuild.yaml deploy adds `--add-cloudsql-instances` + `--set-secrets`. Deploy d0181f1 SUCCESS; alembic ran on Postgres (logs).
- Prod bug: token secret had trailing newline (openssl | gcloud) → "Invalid token". Fixed by stripping in auth compare (+ test).
- Carry-forward: user signs in on phone with token (`gcloud secrets versions access latest --secret=fittrack-app-token --project=fittrack-prod-anildara`), then Phase 2 (USDA + Open Food Facts).

## 2026-09-13 — Project kickoff
- User asked for a personal MyFitnessPal clone, built incrementally, deployed to their Google Cloud, code on GitHub.
- Wrote PLAN.md: scope table, architecture (single Cloud Run container: FastAPI + React PWA, Cloud SQL Postgres), data model (per-100 g nutrition), 8 phases (0 = pipeline first), cost (~$9/mo, Cloud SQL is the only real line), open decisions.
- Stack chosen to match MedIQ/NuroQ habits. Food data: USDA FoodData Central + Open Food Facts; auth: Firebase Google sign-in with email allowlist.
- Carry-forward: user to confirm region / DB / repo name defaults, then start Phase 0.
