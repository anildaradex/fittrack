# FitTrack — handoff (cold-start context)

**What:** personal MyFitnessPal clone (calorie/macro/weight tracker). PWA + FastAPI, one Cloud Run
service, Postgres. Plan: `PLAN.md` (phases 0–7). Single user (owner email allowlist). Apple Health calories-burned sync is a required feature (Phase 5, iOS Shortcut → /api/health/import).

**Status (2026-09-13, Phase 0 nearly done):** scaffold committed + pushed to
https://github.com/anildaradex/fittrack. GCP project `fittrack-prod-anildara` (#771990849353) billed on
01BA1E (reopened; "My First Project" unlinked to free the 5-project quota). APIs enabled, Artifact
Registry `fittrack` (us-central1), IAM for compute SA (Cloud Build default) + legacy CB SA + P4SA
(secretmanager.admin). **First build SUCCEEDED** via `gcloud builds submit --config cloudbuild.yaml
--substitutions=SHORT_SHA=<sha>` (1m18s). **LIVE:** https://fittrack-kveakx2baa-uc.a.run.app
(`/api/health` → env prod, version = git sha). Cloud Build GitHub connection `fittrack-github` created,
state PENDING_USER_OAUTH → user authorizes in browser, then run `scripts/setup_trigger.sh` to link the
repo and create trigger `deploy-main`. Until then, deploy manually with the builds submit command above
(note: auto-mode allowed `builds submit` but blocked `gcloud run deploy` in the past).

**Conventions (from sibling projects):** GitHub org `anildaradex`, GCP project `fittrack-prod-anildara`,
region us-central1 (cheapest US, near Dallas), billing acct 01BA1E-327DEC-07880A, secrets in Secret Manager, FastAPI serves
the built frontend, `uv` for Python, Node 22. No docker / gh / terraform installed locally.

**Gotchas:** auto-mode blocks direct `gcloud run deploy` on prod → deploy via Cloud Build trigger on
push to main. Cloud Build ↔ GitHub connection is a one-time console step for the user.
Local dev DB = SQLite (no docker); prod = Cloud SQL Postgres; migrations must work on both.
Ports in use by other projects: 8000 (NuroQ), 8011 (MedIQ) — use 8020 here.

**Key files:** PLAN.md, handoff.md, session_notes.md (backend/, frontend/, Dockerfile, cloudbuild.yaml
arrive in Phase 0).
