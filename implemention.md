# Backend implementation plan — Supabase (local-first, then hosted)

## Context

StudyMatch has no backend yet — every screen renders mock data defined inline (per `CLAUDE.md`). This plan builds the real backend, starting with **where accounts are stored**. The schema, RLS shape, auth gate, and business-logic rules are already speced in [docs/backend-dev.md](docs/backend-dev.md) and [docs/studymatch_full_architecture.md](docs/studymatch_full_architecture.md) (§3, §7, §8, §9) — this plan turns those specs into an ordered, executable sequence.

**Confirmed decisions:**
- **Local-first**: develop against the Supabase CLI's local stack (Docker: Postgres + Auth + Realtime + Studio), no hosted project needed yet. Link to a hosted Supabase project later once local is working.
- **Migrations via Supabase CLI**: versioned `.sql` files under `StudyMatch/supabase/migrations/`, applied with `supabase migration up` locally and `supabase db push` to hosted later — not hand-run SQL in a dashboard.
- **Build order**: Phase 1 = accounts (users table + `.edu` Auth gate + RLS) since that's the immediate question. Then matches/messages/study_dates, then Realtime, then business logic (trust score, shadowban, timeout cron).
- **Frontend wiring happens at the end of EVERY phase, not batched at the end.** Each phase below ends with a "Frontend wiring" step that connects whatever screens that phase just unblocked to real Supabase calls, before moving to the next phase. No dangling "wire it all up later" step.

## Prerequisites (one-time, user does this)
- Docker Desktop installed and running (the local Supabase stack runs in containers).
- Supabase CLI available (`npx supabase --version`, or a global install via Scoop on Windows).
- No Supabase account needed yet for local dev; only needed later when linking a hosted project.

## Phases

### Phase 0 — Scaffold the Supabase project structure
- `cd StudyMatch && npx supabase init` → creates `StudyMatch/supabase/` with `config.toml`, `migrations/`, `seed.sql`.
- `npx supabase start` → boots local Postgres/Auth/Realtime/Studio via Docker; prints local API URL + anon/service keys (used later for app config, not committed).
- Add Supabase CLI's local-only artifacts (`.branches/`, `.temp/`) to `.gitignore`; commit `config.toml` and `migrations/`.
- **Verify**: `npx supabase status` shows all services running; Studio reachable at the printed local URL.

### Phase 1 — Accounts: `users` table, `.edu` Auth gate, RLS (answers "where are accounts stored")
This is the core of "where can they be stored": accounts live in Supabase's built-in `auth.users` (managed by Supabase Auth — handles email, password/OTP, session tokens) plus a **public `users` profile table** keyed 1:1 by `id UUID REFERENCES auth.users(id)`, holding the app-specific fields (name, university, department, trust_score, etc.) that `auth.users` doesn't have room for.

**Email verification approach**: For Phase 1, add a mock `verification_code TEXT DEFAULT '000000'` column to the `users` table so all signups can be tested locally with a hardcoded code. Later (Phase 2+), this will be replaced with real Supabase Auth email confirmation (magic links/OTP).

- **Migration 1** (`..._create_users_table.sql`): create `public.users` per the schema in `docs/backend-dev.md` (lines 27-50) — snake_case columns, `trust_score INTEGER DEFAULT 100`, `active_match_id UUID`, `verification_code TEXT DEFAULT '000000'` (mock for local testing), etc. Add indexes (`idx_users_active_match_id`).
- **Migration 2** (`..._edu_email_gate.sql`): trigger on `auth.users` (BEFORE INSERT) rejecting non-`.edu`/`.edu.tr` emails, per `docs/backend-dev.md` lines 135-151. Verify this mechanism is still current for the installed Supabase CLI/Auth version (Supabase has moved some gating to Auth Hooks in newer versions) — check the bundled GoTrue version; use a trigger if it still works against `auth.users`, otherwise use the current Postgres Auth Hook equivalent.
- **Migration 3** (`..._users_row_created.sql`): trigger `on_auth_user_created` (AFTER INSERT on `auth.users`) that inserts a matching blank row into `public.users` — the standard Supabase pattern to keep the profile table in sync with `auth.users` automatically on signup.
- **Migration 4** (`..._users_rls.sql`): enable RLS on `public.users`; policies — a user can `SELECT`/`UPDATE` their own row (`auth.uid() = id`). Keep it to own-row read/write only for Phase 1; broader read access (for Discovery) is deferred to Phase 4/5 when the `discoverable_users` view exists.
- **Verify**: `npx supabase migration up`; in Studio, sign up a test user via Auth → confirm `public.users` row auto-created; try a non-`.edu` email → confirm rejected; confirm RLS blocks reading another user's row when queried as an authenticated non-matching user. **[DONE — verified, see docs/development.md Session 3]**
- **Frontend wiring (do next, before Phase 2)**: install `@supabase/supabase-js` in `StudyMatch/` and add a client singleton (local URL/anon key from `supabase status`). Wire the 4 registration screens (`RegisterVerificationScreen.tsx` → `RegisterFinalScreen.tsx`) to real calls: Step 1 becomes `supabase.auth.signUp({ email })`, surfacing the `.edu` gate's Postgres error as the on-screen validation error instead of the current client-side regex-only check; Steps 2-4 become `UPDATE`s against `public.users` (name, university, department, traits→current_tags, focusGoal→current_goal_text) instead of just accumulating in navigation params. Add the camelCase↔snake_case mapping helpers from `docs/integration.md` at this data-access boundary now, since every later phase's wiring reuses them. **Verify**: sign up through the actual app UI (not Studio) with a non-`.edu` email → real backend error shown; a `.edu` email → succeeds, and Steps 2-4's entered fields appear in `public.users` when queried in Studio.

### Phase 2 — Core relational tables: `matches`, `messages`, `study_dates`
- **Migration 5**: create all three tables per `docs/backend-dev.md` lines 52-83, with FKs to `public.users` and each other, `CHECK` constraints on `status` enums, and the indexes listed (lines 88-97).
- **Migration 6**: RLS on all three — `matches`: read/write where `auth.uid()` is `user1_id`/`user2_id`; `messages`: read/write only via subquery against `matches` (pattern already in docs, lines 113-125); `study_dates`: same pattern, scoped through `matches`.
- **Verify**: manually insert two test users + a match row in Studio; confirm the messages RLS policy allows/denies correctly when tested as each user. **[DONE — verified at SQL and REST level, see docs/development.md Session 4]**
- **Frontend wiring**: `ChatScreen.tsx` swaps its mock message array for real `messages` queries scoped to a `match_id`; `StudyDatePlannerScreen.tsx` swaps mock planner state for real `study_dates` rows. `DiscoveryScreen.tsx`/`StudentProfileScreen.tsx` can start reading real `public.users` profiles for cards (still no Realtime lock yet — that's Phase 4). **Verify**: two real accounts can exchange a message/study-date row through the app UI and see it persisted in Studio. **[DONE — Chat + Planner wired (matched-partner profile reads enabled via `users_select_matched` policy); Discovery card reads deferred to Phase 4's `discoverable_users` view since cross-user reads outside a match aren't allowed by RLS until then]**

### Phase 3 — Lock System enforcement at the DB layer
- **Migration 7**: enforce the single-active-match invariant (`docs/backend-dev.md` lines 250-266) as a `BEFORE INSERT/UPDATE` trigger on `matches` that raises if either `user1_id` or `user2_id` already has a non-null `active_match_id` pointing elsewhere. (Flagging explicitly: the docs' illustrative `CHECK` constraint referencing another table isn't valid Postgres — a trigger is the correct mechanism, not a doc bug to replicate.) **[DONE — `enforce_single_active_match()` + `sync_active_match_id()` trigger pair, verified SQL + REST level, see docs/development.md Session 5]**
- **Verify**: attempt to create a second active match for a user who already has `active_match_id` set → confirm the trigger raises and the insert is rejected. **[DONE]**
- **Frontend wiring**: Discovery screen's swipe/match action now attempts a real `matches` insert and surfaces the trigger's rejection (already locked) as the "you're already in a study date" UI state instead of a mock toggle. **[PARTIAL — `ChatScreen.tsx`'s "End Match" (PRD §5 Manual Termination) wired to `UPDATE matches SET status='terminated'`, exercising the trigger's unlock path. Discovery's swipe-to-insert half deliberately deferred to Phase 4: Discovery has no real candidate users to swipe on until `discoverable_users` + broader RLS exist, so it lands together with that phase instead of faking a target user now.]**

### Phase 4 — Realtime + shadowban view **[DONE — see docs/development.md Session 7]**
- **Migration 8**: `ALTER PUBLICATION supabase_realtime ADD TABLE matches;` (and `messages`) so the frontend can subscribe. **[DONE — `realtime_publication.sql`]**
- **Migration 9**: `discoverable_users` view (`trust_score >= 60`), per docs lines 203-214. **[DONE — `discoverable_users_view.sql`, with an explicit column list excluding `email`/`verification_code` rather than the doc's literal `SELECT *` — flagged and reasoned through in the migration header and dev log]**
- **Verify**: confirm the publication includes both tables; confirm the view excludes a manually-lowered test user's `trust_score`. **[DONE — plus a real websocket test (not just SQL) proving RLS actually gates Realtime delivery, even for a subscriber with zero client-side filter]**
- **Frontend wiring**: `DiscoveryScreen.tsx` reads from `discoverable_users` instead of raw `public.users` (so shadowbanned users are actually excluded). Subscribe to the `matches` Realtime channel so both users' Discovery screens lock/unlock live the instant a match forms, replacing the current static mock lock state — this is the actual Lock System, not a placeholder. **[DONE — mock `PROFILES` array removed; real swipe-to-insert completes the piece Phase 3 deferred; one Realtime subscription (not a special-cased post-insert navigate) drives lock/unlock for both participants; new `LockedState` implements the "you're already in a study date" UI]**

### Phase 5 — Business logic: trust score + match timeout **[DONE — see docs/development.md Session 14]**
- **Migration 14** (`post_date_surveys.sql`): `public.post_date_surveys` table (dedup via `UNIQUE(study_date_id, reviewer_id)`, not a separate audit table) + `submit_post_date_survey(study_date_id, met, environment, badge)` RPC — atomic, floor-clamped. **[DONE — deliberately NOT a standalone `apply_trust_delta(user_id, delta)` RPC as originally planned: that shape (arbitrary target + arbitrary signed delta, both client-supplied) would let any authenticated client forge anyone's trust_score. The delta is fixed constants computed inline, and target is derived server-side. Also: only the `+2`/`-25` tiers were implemented here — the PRD's `-10` last-minute-cancel tier had no attribution mechanism anywhere in the schema and no "last-minute" definition, flagged as a deferred gap rather than guessed at. **Closed in Session 18**: `last_minute_cancellation.sql` adds a dedicated `cancel_study_date()` RPC (chosen over 2 other proposed designs — a trigger-driven direct UPDATE, and a survey-only extension with no objective timestamp rule) + a guard trigger blocking direct client writes to the new `cancelled_by`/`cancelled_at` columns, plus a companion fix to `submit_post_date_survey` closing a double-penalty vector the cancellation concept newly opened up. No frontend UI yet — flagged as still open, see development.md Session 18]**
- **Migration 15** (`match_timeout_cron.sql`): match-timeout sweep as a `pg_cron` job. **[DONE — `pg_cron` availability verified empirically against the local Docker stack (already in `shared_preload_libraries`) before writing the migration, not assumed. Reuses the existing Lock System trigger (`sync_active_match_id()`) for the unlock instead of duplicating that logic]**
- **Verify**: manually backdate a test match's `updated_at`; invoke the sweep function directly and confirm status flips to `expired` and both users' `active_match_id` clear together. **[DONE, plus confirmed a match with a recent message does NOT expire despite an equally stale `updated_at`]**
- **Frontend wiring**: build the post-date survey UI (3 quick questions from PRD §7) that calls the survey RPC via `supabase.rpc(...)`; profile screens show real badge counts from `public.users.badges` instead of mock data; a match expiring via the cron sweep is reflected live through the Phase 4 Realtime subscription (Discovery unlocks automatically, no app restart needed). **[DONE — new `PostDateSurveyScreen.tsx` (modal) + a survey-eligibility banner in `ChatScreen.tsx`; `MyProfileScreen.tsx` already read real `badges` since Session 13, this phase is what starts populating it; the Realtime unlock path was already proven working in Phase 4/Session 7 and is unmodified by this phase]**
- **Gated on `study_dates.status <> 'cancelled'` rather than `= 'accepted'`**: no "accept" flow exists anywhere in `StudyDatePlannerScreen.tsx` (every real study date stays `'pending'`) — gating on `'accepted'` would have made the survey silently unreachable. Building the accept flow is a separate, still-open gap.

**Scope guardrail — stay pure SQL here, do NOT add Edge Functions in this phase.** Both the trust-score delta and the timeout sweep are pure state mutations (arithmetic + a status flip) with zero external I/O — SQL/plpgsql is the correct, not just adequate, tool, consistent with every other transactional piece already built (Lock System, mutual match formation). Architecture review (2026-07-14): scanned the full PRD for anything genuinely requiring external calls that plain Postgres cannot make:
- **Push notifications** for scheduled Study Dates (PRD §6) — the one clear case needing an Edge Function (or a Database Webhook triggering one) to call FCM/APNs. **Not in scope for Phase 5 or any phase yet**: the React Native app has no push notification library installed at all (no FCM/APNs SDK, no permission flow, no device-token registration). Building server-side notification code with nothing on the client able to receive it is speculative, unused work — this is a **frontend prerequisite**, not a backend task, and should only be picked up once that client-side groundwork exists as its own scoped feature.
- **Hard-ban session revocation** (PRD §8) — needs the Supabase Auth Admin API (`service_role` key), which must never be reachable from a plain SQL function callable by `authenticated`. When moderation/hard-ban is actually built, this one piece needs a small Edge Function; everything else in moderation (instant match termination, shadowban) stays SQL, unchanged from the current approach.
- Passwordless OTP/magic-link email (PRD §3) needs no custom code either way — Supabase Auth's built-in GoTrue already sends these natively.

If a future phase does need an Edge Function, prefer a **Database Webhook** (declarative, fires on a row change) over a `pg_net` HTTP call embedded inside a trigger — keeps HTTP latency/failure handling out of transactional trigger code, the exact kind of concern-mixing that caused the race conditions fixed in Sessions 6 and 10.

### Phase 6 — Link to a hosted Supabase project (when ready, later)
- User creates a project at supabase.com (manual step — account creation isn't something Claude can do on your behalf).
- `npx supabase link --project-ref <ref>`, then `npx supabase db push` to apply all local migrations to the hosted DB.
- Re-verify the `.edu` gate mechanism against the hosted project's actual Auth version, since hosted may differ from the local Docker image.
- **Frontend wiring**: swap the Supabase client singleton's local URL/anon key for the hosted project's values (e.g. via env config) — no other frontend code changes, since all prior phases already wired against the same `supabase-js` client interface.

### Phase 7 — Recommendation & filter-based matching for Discovery (planned, not started)

#### Context
Discovery currently shows `discoverable_users` candidates in whatever order the view returns — no ranking, no filtering. Two things have sat unfinished:
- `FilterScreen.tsx` has a full filter UI (`DiscoveryFilters`: institution, university, departments, distance, age range) that **round-trips through navigation params but was never wired to the Discovery query** — selecting filters currently does nothing.
- Session 11 deliberately **removed** a fake "98% match" percentage badge from the Dashboard because there was no real algorithm behind it, flagging that a genuine one could bring it back later.

This phase builds both: real filters that actually restrict who shows up, and a real compatibility-scoring algorithm that ranks who shows up first.

**Confirmed decisions (asked directly, not assumed):**
- **Both filtering and ranking** — filters narrow the candidate pool; a match-score orders it.
- **Show the score on Discovery cards** — a real number, following Session 11's precedent.
- **Scoring computed in SQL**, inside the `discoverable_users` view, not client-side.
- **Real age via a new `birthdate` column** — the existing "age range" filter becomes functional. No new native dependency (a plain day/month/year numeric input in `EditProfileScreen.tsx`, not a native date-picker library).
- **Distance becomes "same city"** via the existing `city` column, not real GPS. Real lat/lng distance would need a new native geolocation dependency + permissions flow — the same cost/risk class this project explicitly deferred for photo uploads in Session 13. Asked directly; user chose the no-native-dependency path.

#### Migration: extend `discoverable_users` + add `birthdate`
One new migration (`StudyMatch/supabase/migrations/<ts>_recommendation_scoring.sql`):
- `ALTER TABLE public.users ADD COLUMN birthdate DATE;` — nullable, not backfilled.
- `CREATE OR REPLACE VIEW public.discoverable_users` (keeps every existing Session 7/8 predicate — `trust_score >= 60`, `active_match_id IS NULL`, not-already-swiped, explicit column list excluding `email`/`verification_code`) and **adds**:
  - `age` — `date_part('year', age(birthdate))::int`, `NULL` if unset. Raw `birthdate` is **not** exposed on the view (same privacy-by-default precedent as excluding `email`/`verification_code`).
  - `same_city` — `boolean`, computed via a self-join to the *caller's own* row (`(SELECT city FROM public.users WHERE id = auth.uid())`), `NULL`-safe. Same "`auth.uid()` re-evaluates per caller inside a non-`security_invoker` view" technique Session 8 already proved correct for the swipe-history exclusion, now used for a viewer-relative *column* instead of a `WHERE`/`NOT EXISTS`.
  - `match_score` — `integer`, 0-100, viewer-relative, same self-join. Weighted, named-constant point system (mirrors the trust-score point-value documentation convention):

    | Signal | Points |
    |---|---|
    | Same `department` | 30 |
    | Same `university` | 15 |
    | Same city | 10 |
    | Each shared `current_tags` entry | 8, capped at 5 shared (max 40) |
    | Same `study_pacing` | 10 |
    | Same `audio_environment` | 5 |
    | Same `study_fuel` | 5 |

    Summed, then `LEAST(100, ...)` clamped. All factors additive-only (no penalties) — zero known overlap scores 0, never negative.
- **NULL-safety, must be explicit, not implicit**: fresh column, no backfill — every existing user's `birthdate`/`age` is `NULL` today, `city` likely unset for most. `age`/`same_city` filters and `match_score` contributions from either must **never silently zero out the whole Discovery deck**. Age/city always contribute `0` to the score (not exclude) when unknown on either side; frontend age/city filters only exclude when the user has actively set them.

#### Frontend: wire the filters for real, add the score badge
- **`src/types/index.ts`**: `DiscoveryFilters.distance: number` → `sameCityOnly: boolean` (breaking, but `FilterScreen.tsx`/`DiscoveryScreen.tsx` are its only two consumers). Add `DiscoveryCandidate` type (`User` + `age?: number`, `sameCity?: boolean`, `matchScore: number`) — a candidate's ranked view is a different shape than "your own profile," don't overload `User`.
- **`src/data/mappers.ts`**: new `mapDiscoveryCandidateFromAPI(row)` alongside the existing `mapUserFromAPI`.
- **`src/screens/DiscoveryScreen.tsx`**: `loadDiscovery()` currently doesn't consume `route.params.filters` at all — add it. Chain PostgREST filters onto the `discoverable_users` query (`.eq('university', ...)`, `.in('department', ...)`, `.gte('age', ...)`, `.lte('age', ...)`, `.eq('same_city', true)` when `sameCityOnly`), each only applied when actually set — and `.order('match_score', { ascending: false })`. `CardFace` gains a small "`{score}% Match`" badge (existing theme tokens only).
- **`src/screens/FilterScreen.tsx`**: replace the (mock, unwired) distance slider with a "Same city only" toggle; wire university/department/age-range fields to actually populate `DiscoveryFilters` for the first time.
- **`src/screens/EditProfileScreen.tsx`**: add a birthdate field (day/month/year numeric inputs, composed into a real `DATE`) and a plain `city` text input if not already present, both in the existing `handleSave` UPDATE payload.

#### Files to change
- **New**: `StudyMatch/supabase/migrations/<ts>_recommendation_scoring.sql`
- **Edit**: `src/types/index.ts`, `src/data/mappers.ts`, `src/screens/DiscoveryScreen.tsx`, `src/screens/FilterScreen.tsx`, `src/screens/EditProfileScreen.tsx`

#### Verify
1. **SQL-level**: confirm `match_score`/`age`/`same_city` are genuinely viewer-relative (same candidate, different values as seen by two different callers); confirm a candidate with `birthdate`/`city` both `NULL` still appears with a score reflecting only known signals (not excluded, not crashing); confirm `LEAST(100, ...)` clamps a maximal-overlap synthetic case.
2. **REST-level**, mirroring `DiscoveryScreen.tsx`'s exact query shape: varied department/university/tags/study-habit overlap → ordering matches expected ranking; each filter individually confirmed correct and NULL-safe (an unset filter never excludes anyone).
3. `npx supabase db reset` — new migration replays clean alongside all prior ones.
4. `npx tsc --noEmit` — 0 errors.
5. On-device verification — same standing limitation as every session since 12.

## Files to be created
- `StudyMatch/supabase/config.toml` (from `supabase init`)
- `StudyMatch/supabase/migrations/<timestamp>_*.sql` — one file per migration listed above (11 total across Phases 1-5)
- Frontend files touched incrementally per phase: a Supabase client module + data-mapping helpers (Phase 1), then targeted edits to `RegisterVerificationScreen.tsx`…`RegisterFinalScreen.tsx` (Phase 1), `ChatScreen.tsx`/`StudyDatePlannerScreen.tsx` (Phase 2), `DiscoveryScreen.tsx` (Phase 3-4), profile/survey screens (Phase 5) — never all at once at the end.

## Verification (end-to-end, after Phase 1 — the immediate ask)
1. `npx supabase start` — local stack up. **[DONE]**
2. `npx supabase migration up` — Phase 1 migrations applied cleanly, no errors. **[DONE]**
3. In local Studio → Auth → create a user with a non-`.edu` email → confirm rejected. **[DONE]**
4. Create a user with a `.edu` email → confirm it succeeds and a matching row appears in `public.users` automatically. **[DONE]**
5. Confirm RLS: querying as that user can read/update their own `public.users` row but not another user's row. **[DONE]**

## Working mode
Implement **one phase at a time**, verifying the backend migrations AND the frontend wiring for that phase before moving to the next. Phases 0-5 are done and verified — every phase in this plan is now complete. Remaining known gaps are cross-phase, not phase-shaped (see docs/development.md's per-session "Next steps"): photo upload, the missing study-date accept flow, the deferred -10 trust-score tier, incomplete-registration, and an on-device verification pass (this environment has no emulator/browser access, so everything since Session 12 is REST/SQL/tsc-verified only). Phase 6 (hosted Supabase) remains for when the user is ready to deploy.
