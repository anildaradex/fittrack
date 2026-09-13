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
- Carry-forward: user authorizes connection → run setup_trigger.sh → push a trivial commit to prove auto-deploy → Phase 1.

## 2026-09-13 — Project kickoff
- User asked for a personal MyFitnessPal clone, built incrementally, deployed to their Google Cloud, code on GitHub.
- Wrote PLAN.md: scope table, architecture (single Cloud Run container: FastAPI + React PWA, Cloud SQL Postgres), data model (per-100 g nutrition), 8 phases (0 = pipeline first), cost (~$9/mo, Cloud SQL is the only real line), open decisions.
- Stack chosen to match MedIQ/NuroQ habits. Food data: USDA FoodData Central + Open Food Facts; auth: Firebase Google sign-in with email allowlist.
- Carry-forward: user to confirm region / DB / repo name defaults, then start Phase 0.
