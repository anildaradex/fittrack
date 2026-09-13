# FitTrack — session notes (newest first)

## 2026-09-13 — Project kickoff
- User asked for a personal MyFitnessPal clone, built incrementally, deployed to their Google Cloud, code on GitHub.
- Wrote PLAN.md: scope table, architecture (single Cloud Run container: FastAPI + React PWA, Cloud SQL Postgres), data model (per-100 g nutrition), 8 phases (0 = pipeline first), cost (~$9/mo, Cloud SQL is the only real line), open decisions.
- Stack chosen to match MedIQ/NuroQ habits. Food data: USDA FoodData Central + Open Food Facts; auth: Firebase Google sign-in with email allowlist.
- Carry-forward: user to confirm region / DB / repo name defaults, then start Phase 0.
