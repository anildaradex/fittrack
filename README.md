# FitTrack

Personal MyFitnessPal-style tracker: food diary, macros, weight, Apple Health calories burned.
Single Cloud Run service (FastAPI serving a React PWA), Cloud SQL Postgres, deployed by Cloud Build on every push to `main`.

See `PLAN.md` for scope and phases, `handoff.md` for cold-start context, `session_notes.md` for the journal.

## Local dev

```bash
# backend (port 8020)
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8020

# frontend (port 5173, proxies /api → 8020)
cd frontend && npm install && npm run dev
```

Tests: `cd backend && uv run pytest -q`

## Deploy

Push to `main`. Cloud Build (`cloudbuild.yaml`) runs tests, builds the image, deploys `fittrack` to Cloud Run in `us-central1`.
