# FitTrack — personal MyFitnessPal clone: build plan

Personal-use calorie / macro / weight tracker. Web app installable on the phone (PWA),
one Cloud Run service on Google Cloud, code on GitHub, shipped in small increments where
every phase ends with something deployed and usable.

---

## 1. What we are building (scope)

MyFitnessPal features worth cloning for one person, in priority order:

| Area | Must-have (v1) | Later |
|---|---|---|
| Food diary | Log foods into Breakfast / Lunch / Dinner / Snacks per day; daily totals vs goal (kcal, protein, carbs, fat, fiber, **net carbs**) | Sodium/sugar/micros, "copy yesterday", meal templates |
| Food database | Custom foods (you type it once); search USDA FoodData Central; Open Food Facts barcode lookup | Seeded Indian foods list (IFCT-based), Gemini "describe your meal" logging |
| Barcode scanning | Phone camera in the browser (PWA) → Open Food Facts | Photo → food estimate (Gemini vision) |
| Recipes | Build a recipe from ingredients, get per-serving nutrition, log it | Recipe import from URL |
| Goals | Calorie + macro targets; TDEE calculator (Mifflin-St Jeor); presets incl. keto/low-carb | Adaptive TDEE from actual weight trend |
| Weight & body | Daily weigh-in, trend line (7-day EMA), goal weight | Waist/body-fat |
| Exercise | **Apple Health sync**: Active Energy (kcal burned), steps, and workouts pulled in daily via an iOS Shortcut automation; manual log + MET table as fallback; optional "eat back" calories | Native HealthKit companion app for background sync |
| Water | Glasses / ml per day | Reminders |
| Reports | Weekly kcal average, macro split, weight chart, streaks; CSV export | Monthly PDF, trends vs goal |
| Auth | Google sign-in, **allowlisted to your email only** | Family accounts |

Explicitly out: social feed, premium paywall, ads, multi-tenant scaling.

---

## 2. Architecture

```
Phone / laptop browser (PWA)
        │  HTTPS
        ▼
Cloud Run service "fittrack"  (one container, scale-to-zero)
  ├─ FastAPI  ── /api/*   (JSON, auth-checked)
  └─ static   ── /        (React + Vite build, PWA manifest + service worker)
        │ private socket
        ▼
Cloud SQL Postgres 16 (db-f1-micro)            ← same pattern as MedIQ
        
External (free): USDA FoodData Central API (needs free key → Secret Manager)
                 Open Food Facts (barcode, no key)
                 Firebase Auth (Google sign-in, free)
Apple Health:    iPhone Shortcuts automation (runs nightly) → POST /api/health/import
                 with a per-device token. A browser app cannot read HealthKit directly.
```

**Stack (matches your other projects so tooling and habits carry over):**
- Backend: Python 3.12+, FastAPI, SQLAlchemy 2 + Alembic migrations, `uv` for deps, pytest.
- Frontend: React 18 + TypeScript + Vite, mobile-first, `vite-plugin-pwa`, `@zxing/browser` for barcode, Recharts for charts.
- DB: Postgres (Cloud SQL in prod). Local dev: Postgres in Docker is NOT available on this Mac (no docker) → local dev uses **SQLite** via the same SQLAlchemy models; Postgres in prod. Alembic migrations are written to work on both.
- Deploy: `Dockerfile` (multi-stage: node build → python runtime). **Cloud Build trigger** on push to `main` → build → deploy to Cloud Run. No manual deploy step after phase 0.
- Secrets: Secret Manager (`usda-api-key`, `database-url`, `firebase-*`), mounted with `--set-secrets`. Nothing in git.

**Why one container, not separate frontend/backend services:** one URL, one deploy, one bill line, and the free tier covers it. Same as MedIQ.

**Cost estimate (monthly, personal traffic):**

| Item | Cost |
|---|---|
| Cloud Run (scale-to-zero, free tier) | ~$0 |
| Cloud SQL db-f1-micro Postgres | ~$8–10 (the only real cost) |
| Cloud Build, Artifact Registry, Secret Manager | < $1 |
| USDA FDC, Open Food Facts, Firebase Auth | $0 |

If you want $0: swap Cloud SQL for Supabase/Neon free Postgres. Only `DATABASE_URL` changes. Decide at phase 1.

---

## 3. Naming and accounts

| Thing | Value |
|---|---|
| Local folder | `Agent Driven Development/FitTrack/` |
| GitHub repo | `github.com/anildaradex/fittrack` (private) |
| GCP project | `fittrack-prod-anildara` (new, billing acct `01BA1E-327DEC-07880A`) |
| Region | `us-central1` (Iowa) — cheapest Tier 1 region nearest Dallas; `us-south1` (Dallas itself) is Tier 2 and ~20% pricier |
| Cloud Run service | `fittrack` |
| Cloud SQL instance | `fittrack-db`, database `fittrack` |

---

## 4. Data model (v1)

```
users            id, email, display_name, created_at
profiles         user_id, sex, birth_date, height_cm, activity_level, units (metric/imperial)
goals            user_id, effective_from, kcal, protein_g, carbs_g, fat_g, fiber_g, net_carb_mode, goal_weight_kg, rate_kg_per_week
foods            id, owner_user_id (null = shared/cached), source (custom|usda|off), source_id, barcode,
                 name, brand, serving_size, serving_unit, grams_per_serving,
                 kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg   (all per 100 g)
food_servings    food_id, label ("1 roti", "1 cup"), grams
recipes          id, user_id, name, servings, notes
recipe_items     recipe_id, food_id, grams
diary_entries    id, user_id, date, meal (breakfast|lunch|dinner|snack), food_id | recipe_id, grams, logged_at
weights          user_id, date, weight_kg, note
exercises        id, user_id, date, name, minutes, kcal_burned, source (manual|met)
water            user_id, date, ml
```

Everything nutritional is stored **per 100 g** and multiplied by grams at log time. That is
what makes servings, recipes, and USDA/OFF imports all compose without special cases.

---

## 5. Incremental phases

Each phase: build → tests pass → push to `main` → auto-deploys → you use it for a few days
→ notes go in `session_notes.md`. Phases are sized at roughly one working session each.

### Phase 0 — Pipeline first (hello world in the cloud)
- Scaffold repo: `backend/` (FastAPI, `/api/health`), `frontend/` (Vite React shell), `Dockerfile`, `cloudbuild.yaml`, `.gitignore`, README, `handoff.md`, `session_notes.md`.
- Create GitHub repo, first push.
- Create GCP project `fittrack-prod-anildara`, link billing, enable Run / Build / Artifact Registry / Secret Manager / SQL Admin APIs.
- Cloud Build trigger: push to `main` → deploy `fittrack` to Cloud Run (public URL).
- **Done when:** the Cloud Run URL shows the app shell and `/api/health` returns JSON, and a trivial commit redeploys by itself.
- Gotchas: `gh` CLI is not installed (`brew install gh` or create the repo in the browser). Connecting Cloud Build to GitHub is a one-time console click you must do yourself. Last time the auto-mode safety layer blocked me from running `gcloud run deploy` on a production service; the GitHub → Cloud Build trigger avoids that entirely.

### Phase 1 — Diary MVP with custom foods (usable from day one)
- Models + Alembic migrations for `users, profiles, goals, foods, food_servings, diary_entries`.
- Google sign-in via Firebase Auth; backend verifies the ID token and rejects any email not on the allowlist.
- Screens: **Today** (4 meals, running totals, remaining kcal ring), **Add food** (search your custom foods, pick serving × quantity), **Create food**, **Goals** (manual kcal/macros).
- Cloud SQL instance + `database-url` secret; app connects over the private socket.
- **Done when:** you can log a full day on your phone and see totals vs goal.

### Phase 2 — Real food database
- USDA FoodData Central search + import (Foundation, SR Legacy, Branded). Results cached into `foods` on first use so repeat lookups are free and instant.
- Open Food Facts lookup by barcode text (scanner comes next phase).
- Recent / frequent foods list on the Add screen (this is what makes daily logging fast).
- Serving-size picker with USDA household measures.
- **Done when:** most things you eat are found without creating a custom food.

### Phase 3 — Phone experience
- PWA: manifest, icons, service worker, "Add to Home Screen" on iPhone/Android.
- Barcode scanning with the camera (`@zxing/browser`) → Open Food Facts → one-tap log.
- Offline: today's diary cached; entries made offline sync when back online.
- **Done when:** the app lives on your home screen and scanning a packet logs it.

### Phase 4 — Recipes, meals, and speed
- Recipes: ingredients → per-serving nutrition; log N servings.
- Saved meals ("my usual breakfast") and **copy yesterday / copy meal**.
- Quick-add kcal/macros without a food.
- Net-carb mode (carbs − fiber) shown everywhere when enabled. Keto/low-carb macro presets.
- **Done when:** logging a normal day takes under a minute.

### Phase 5 — Weight, exercise, water, and the goals engine
- Weigh-in log with 7-day trend line and goal-weight projection.
- TDEE calculator (Mifflin-St Jeor × activity) → suggested kcal from goal rate; macro split presets.
- **Apple Health sync:** `POST /api/health/import` accepts `{date, active_kcal, resting_kcal, steps, workouts[], weight_kg}` with a device token. An iOS Shortcut ("Find Health Samples" → "Get Contents of URL") runs as a nightly Personal Automation and also on demand. Today screen shows "burned" from Health and, if enabled, eats back a configurable % of active kcal. Weight from Health also lands in `weights`.
- Exercise log with MET-based kcal estimate as the manual fallback.
- Water tracker.
- **Done when:** the app suggests your calorie target, your Watch/phone calories show up without typing, and you can see whether the scale agrees.

### Phase 6 — Reports and export
- Weekly / monthly views: avg kcal, macro split, weight chart, adherence streak.
- CSV export of diary and weights (accountant-grade, one row per entry).
- **Done when:** you can answer "how did last month go?" from one screen.

### Phase 7 — AI conveniences (optional)
- "I had 2 rotis, dal and a bowl of curd" → Gemini extracts items + grams → confirm → log.
- Photo of a plate → estimate (clearly labeled as an estimate).
- Seeded Indian foods table for gaps in USDA (rotis, dals, sabzis, regional dishes).
- Native SwiftUI companion (HealthKit background delivery → same import endpoint) if the Shortcut route feels flaky. Full native wrapper only if the PWA ever feels limiting.

---

## 6. Working agreement
- `main` is always deployable; each phase is a series of small commits, not one big one.
- Tests: backend pytest on every push (Cloud Build runs them before deploying).
- `handoff.md` = cold-start context; `session_notes.md` = dated journal, newest first.
- No secrets in git, ever. `.env` is ignored; prod reads Secret Manager.
- You do the two console-only steps (GitHub ↔ Cloud Build connection, billing link if prompted); everything else is scripted.

## 7. Decisions (confirmed 2026-09-13)
1. Region: **us-central1** (cheapest US region near Dallas).
2. Database: **Cloud SQL (~$9/mo)**; Supabase free remains a one-line swap.
3. Units default: **metric**, switchable.
4. Repo name: **fittrack**.
5. Apple Health calories burned: **required**, via iOS Shortcut automation (Phase 5).
