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
- **Migration 7**: enforce the single-active-match invariant (`docs/backend-dev.md` lines 250-266) as a `BEFORE INSERT/UPDATE` trigger on `matches` that raises if either `user1_id` or `user2_id` already has a non-null `active_match_id` pointing elsewhere. (Flagging explicitly: the docs' illustrative `CHECK` constraint referencing another table isn't valid Postgres — a trigger is the correct mechanism, not a doc bug to replicate.)
- **Verify**: attempt to create a second active match for a user who already has `active_match_id` set → confirm the trigger raises and the insert is rejected.
- **Frontend wiring**: Discovery screen's swipe/match action now attempts a real `matches` insert and surfaces the trigger's rejection (already locked) as the "you're already in a study date" UI state instead of a mock toggle.

### Phase 4 — Realtime + shadowban view
- **Migration 8**: `ALTER PUBLICATION supabase_realtime ADD TABLE matches;` (and `messages`) so the frontend can subscribe.
- **Migration 9**: `discoverable_users` view (`trust_score >= 60`), per docs lines 203-214.
- **Verify**: confirm the publication includes both tables; confirm the view excludes a manually-lowered test user's `trust_score`.
- **Frontend wiring**: `DiscoveryScreen.tsx` reads from `discoverable_users` instead of raw `public.users` (so shadowbanned users are actually excluded). Subscribe to the `matches` Realtime channel so both users' Discovery screens lock/unlock live the instant a match forms, replacing the current static mock lock state — this is the actual Lock System, not a placeholder.

### Phase 5 — Business logic: trust score + match timeout
- **Migration 10**: `apply_trust_delta(user_id, delta)` plpgsql function — atomic, floor-clamped, per docs lines 180-197. Add a small audit table (unique on survey/match + user) so a resubmitted survey can't double-apply — the docs require this but don't show the dedup mechanism; this migration adds it explicitly.
- **Migration 11**: match-timeout sweep as a `pg_cron` job (verify the `pg_cron` extension is enabled — available on all Supabase tiers but must be explicitly created; the local Docker stack may need it added manually) — atomic transaction expiring stale matches and nulling `active_match_id` on both users, per docs lines 216-248.
- **Verify**: manually backdate a test match's `updated_at`; invoke the sweep function directly and confirm status flips to `expired` and both users' `active_match_id` clear together.
- **Frontend wiring**: build the post-date survey UI (3 quick questions from PRD §7) that calls `apply_trust_delta` via `supabase.rpc(...)`; profile screens show real badge counts from `public.users.badges` instead of mock data; a match expiring via the cron sweep is reflected live through the Phase 4 Realtime subscription (Discovery unlocks automatically, no app restart needed).

### Phase 6 — Link to a hosted Supabase project (when ready, later)
- User creates a project at supabase.com (manual step — account creation isn't something Claude can do on your behalf).
- `npx supabase link --project-ref <ref>`, then `npx supabase db push` to apply all local migrations to the hosted DB.
- Re-verify the `.edu` gate mechanism against the hosted project's actual Auth version, since hosted may differ from the local Docker image.
- **Frontend wiring**: swap the Supabase client singleton's local URL/anon key for the hosted project's values (e.g. via env config) — no other frontend code changes, since all prior phases already wired against the same `supabase-js` client interface.

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
Implement **one phase at a time**, verifying the backend migrations AND the frontend wiring for that phase before moving to the next. Phases 0-2 (backend + frontend wiring) are done and verified; next up is Phase 3 (Lock System trigger + Discovery wiring).
