# Backend Developer Guide

This guide covers backend development (Supabase, PostgreSQL, Edge Functions) for StudyMatch. Designed primarily for the [studymatch-supabase](./../.claude/agents/studymatch-supabase.md) and [studymatch-logic](./../.claude/agents/studymatch-logic.md) subagents.

> **Status**: In progress — see [development.md](development.md) Session 3 and [implemention.md](../implemention.md) for the phased build-out. Local Supabase stack is running (`StudyMatch/supabase/`); Phase 1 (`users` table, `.edu` gate, RLS) is implemented and verified. Sections below describe the full planned structure; items already built are marked accordingly.

---

## Tech Stack (Planned)

- **Database**: PostgreSQL (Supabase-hosted)
- **Auth**: Supabase Auth with OTP/magic link, `.edu` email gate
- **Realtime**: Supabase Realtime subscriptions (WebSocket-based)
- **Storage**: Supabase Storage for profile photos
- **Edge Functions**: Deno/TypeScript for trust-score logic, timeouts, cron jobs

---

## Database Schema (Planned)

**Naming convention**: `snake_case` (Postgres standard). Frontend uses camelCase; a mapping layer is required at the data boundary (see [integration.md](integration.md)).

### Core Tables

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  university TEXT,
  department TEXT,
  grade INTEGER,
  year TEXT CHECK (year IN ('Freshman', 'Sophomore', 'Junior', 'Senior')),
  trust_score INTEGER DEFAULT 100,
  badges JSONB DEFAULT '{}',
  current_goal_text TEXT,
  current_tags TEXT[],
  active_match_id UUID,
  audio_environment TEXT,
  study_pacing TEXT,
  study_fuel TEXT,
  photo_url TEXT,
  photos TEXT[],
  bio TEXT,
  availability TEXT[],
  city TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id),
  user2_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated', 'expired')),
  user1_revealed BOOLEAN DEFAULT FALSE,
  user2_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- study_dates table
CREATE TABLE study_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES users(id),
  location TEXT,
  scheduled_time TIMESTAMP,
  focus_subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes (Planned)

```sql
-- Foreign key lookups and frequent filters
CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_study_dates_match_id ON study_dates(match_id);
CREATE INDEX idx_users_active_match_id ON users(active_match_id);
```

---

## Row Level Security (Planned)

RLS **enabled on all tables from creation** — never leave a table RLS-disabled "for now."

### Example Policies

**Users table**: Users can read their own row; limited access to other users (e.g., in a match).

**Matches table**: Users can read/write matches where they are `user1_id` or `user2_id`.

**Messages table**: Users can read messages only for matches they're in (via subquery against `matches` table, not a denormalized copy).

```sql
-- Example: users can SELECT messages only from their matches
CREATE POLICY "users_can_read_own_match_messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );
```

---

## Auth Setup (Planned)

### `.edu` Email Gate — Implemented (Phase 1, hardened Session 17)

Reject registration if email does not end in `.edu` or `.edu.tr`. Enforce at the database level via trigger or Supabase Auth hook (verify current mechanism with Supabase docs).

**Session 17 hardening**: the original trigger (`enforce_edu_email()`) was wired only to `BEFORE INSERT ON auth.users`, so it gated signup but not a later `supabase.auth.updateUser({ email: 'anyone@gmail.com' })` — a permanent bypass once an account existed. `edu_email_gate_on_update.sql` adds a second trigger, `BEFORE UPDATE OF email ON auth.users WHEN (NEW.email IS DISTINCT FROM OLD.email)`, reusing the same function. Verified through the **full real GoTrue flow**, not just a simulated SQL update: this project's local config has `double_confirm_changes = true`, so `updateUser({email})` doesn't touch `auth.users.email` immediately — it queues a confirmation email (captured via the local Mailpit inbox at `MAILPIT_URL`) and only applies the change when that link is followed. Confirmed by extracting the real link from Mailpit and following it: a non-`.edu` target email fails at that point (GoTrue surfaces `error_code=unexpected_failure`, the trigger's rejection), while `auth.users.email` remains untouched throughout; a legitimate `.edu`-to-`.edu.tr` transfer through the identical flow succeeds and the column updates correctly.

```sql
-- Example trigger (mechanism may differ in current Supabase version)
CREATE OR REPLACE FUNCTION enforce_edu_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT (NEW.email ~* '\.edu(\.tr)?$') THEN
    RAISE EXCEPTION 'Email must be from a .edu or .edu.tr domain';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER edu_email_check
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_edu_email();
```

---

## Realtime Configuration — Implemented (Phase 4)

`matches` and `messages` are both published, in `realtime_publication.sql`:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

RLS applies to `postgres_changes` exactly as it does to a normal `SELECT` — no separate config needed, and no changes were needed to Migration 6's existing `matches_select_participant`/`messages_select_participant` policies. This was verified directly, not just asserted from documentation: a Node script using the real `@supabase/supabase-js` client subscribed a non-participant with **zero client-side filter** (the actual "firehose" case) to `matches` and received nothing when a match formed between two other users, while the real participant (filtered) received the event immediately. See `docs/development.md` Session 7.

`DiscoveryScreen.tsx` subscribes directly to `matches` (not `users`) for the Lock System, since `users` was never added to the publication in this phase — see Session 7 for why.

---

## Business Logic

### Trust Score Algorithm — Implemented (Phase 5)

Implemented as `submit_post_date_survey(study_date_id, met, environment, badge)` (`SECURITY DEFINER` plpgsql, `post_date_surveys.sql`) — **not** as a standalone `apply_trust_delta(user_id, delta)` RPC callable with a free-form delta/target, despite the illustrative example below still showing that shape. Exposing that literally would let any authenticated client forge anyone's trust_score (arbitrary signed delta + arbitrary target); the delta is instead computed from fixed constants inline in the survey function, and `target_id` is derived server-side (the other participant of the study date's match), never accepted as a parameter. See `docs/development.md` Session 14 for the full reasoning.

Only two of the three point values below are implemented — see the "not implemented" note under Match Timeout below the table for why:

- **+2**: Successful meeting (survey `met=true`) — **implemented**
- **−10**: Last-minute cancellation — **not implemented**. The survey's Q1 is a binary "did the meeting happen?" Yes/No, with no attribution anywhere in the schema for *who* cancelled or *when* relative to the scheduled time, and no "last-minute" threshold defined anywhere in the PRD. Building this needs a product decision first (a new column + a definition of "last-minute"), not a guess. Flagged as a deferred gap, not a bug.
- **−25**: No-show / ghosting (survey `met=false`) — **implemented**

**Requirement**: Mutations are transactional — satisfied via a single atomic `UPDATE ... SET trust_score = GREATEST(trust_score + delta, 0) WHERE id = target_id` inside `submit_post_date_survey`, guarded against retries/resubmission by `post_date_surveys`' `UNIQUE(study_date_id, reviewer_id)` constraint (a resubmission is a `23505`, not a silent double-apply).

The function below is the **original illustrative example only** — kept here for history, not as the implemented shape. It is deliberately **not** what got built: exposing a public RPC with an arbitrary `user_id` + signed `delta` parameter would let any authenticated client set anyone's trust_score to anything. The real implementation computes the delta from fixed constants (+2/−25) inline and derives the target server-side; see `submit_post_date_survey` in `post_date_surveys.sql` and `docs/development.md` Session 14.

```sql
-- Original illustrative example — NOT the implemented shape, see note above.
CREATE OR REPLACE FUNCTION apply_trust_delta(
  user_id UUID,
  delta INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_score INTEGER;
BEGIN
  UPDATE users
  SET trust_score = GREATEST(trust_score + delta, 0)  -- Floor at 0
  WHERE id = user_id
  RETURNING trust_score INTO new_score;
  RETURN new_score;
END;
$$ LANGUAGE plpgsql;
```

**Validation**: Malformed/duplicate survey submissions are rejected before any score mutation runs (participant check, future-date check, then the `UNIQUE` constraint) — fail closed, not open. Verified via SQL and real REST calls, see `docs/development.md` Session 14.

**Documentation**: Point values are named constants (`+2`/`−25`) inline in `submit_post_date_survey`, not scattered magic numbers.

### Shadowban Filtering — Implemented (Phase 4)

Users with `trust_score < 60` are invisible in the Discovery matching pool but can still use the app normally (not banned, just hidden) — verified: a shadowbanned test user can still read her own `public.users` row directly.

Implemented as `discoverable_users_view.sql`, with one deviation from the literal `SELECT *` above: an explicit column list that excludes `email` and `verification_code` (neither read by the frontend `User` type; no reason to broadcast either to every authenticated client via Discovery). See `docs/development.md` Session 7 for the full reasoning and how cross-user reads work without loosening `public.users`' own-row RLS (the view deliberately isn't `security_invoker`).

`DiscoveryScreen.tsx` reads from `discoverable_users` (excluding self and already-locked candidates) instead of the raw `users` table — confirmed via REST-level testing matching the screen's exact query shape.

**Hardened in `discoverable_users_hardening.sql` (Session 8)** after a bug-hunt audit found two gaps: the `active_match_id IS NULL` exclusion was only ever applied client-side (a query-string param any authenticated client could omit), and there was no persisted swipe/pass history so a refreshed Discovery deck would loop the same candidates forever. The view now enforces `active_match_id IS NULL` itself and adds `NOT EXISTS (... public.swipes ...)` keyed on `auth.uid()`, backed by a new `public.swipes` table (own-row RLS, `UNIQUE (swiper_id, target_id)`, no `UPDATE`/`DELETE` — a swipe decision is permanent). See `docs/development.md` Session 8, including the empirical two-caller test proving `auth.uid()` re-evaluates per querying session inside a non-`security_invoker` view rather than being fixed at view-creation time.

### Match Timeout Cron Job — Implemented (Phase 5)

Runs every 15 minutes to find `matches` where `status = 'active'`, `updated_at < NOW() - 12h`, and no `messages` exist with `created_at` in the last 12 hours, then sets `status = 'expired'`.

**Requirement**: The entire operation is **atomic** — satisfied by a single `UPDATE` statement (Postgres's normal statement-level atomicity), no explicit transaction wrapper needed.

**Coordination** (this doc's original requirement, confirmed satisfied rather than assumed): the cron function does **not** separately null `active_match_id` — `sync_active_match_id()` (the Lock System's existing trigger, Migration 7) already does that generically for both participants on *any* `matches.status` transition away from `'active'`, confirmed by reading its source before writing this. Duplicating that logic in the cron function would be the exact kind of bypass this requirement warns against; going through the same trigger is what satisfies it.

Implemented in `match_timeout_cron.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.expire_stale_matches()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.matches
     SET status = 'expired'
   WHERE status = 'active'
     AND updated_at < NOW() - INTERVAL '12 hours'
     AND NOT EXISTS (
       SELECT 1 FROM public.messages
        WHERE messages.match_id = matches.id
          AND messages.created_at > NOW() - INTERVAL '12 hours'
     );
$$;

REVOKE EXECUTE ON FUNCTION public.expire_stale_matches() FROM PUBLIC;

SELECT cron.schedule('match-timeout-sweep', '*/15 * * * *', 'SELECT public.expire_stale_matches();');
```

`pg_cron` availability was verified empirically against this stack's local Docker Postgres image (already in `shared_preload_libraries`) rather than assumed — see `docs/development.md` Session 14. `expire_stale_matches()` has `EXECUTE` explicitly revoked from `PUBLIC` (Postgres grants it by default on new functions) since it sweeps *all* stale matches with no per-caller scoping and must never be directly callable by `authenticated`/`anon` — verified via `has_function_privilege` and a real REST call attempt.

Known nuance, documented rather than "fixed": `matches.updated_at` is currently only ever set at row-creation — nothing bumps it on later activity (e.g. a reveal-flag toggle). This doesn't produce an incorrect sweep result today because the `NOT EXISTS (recent message)` clause is what actually protects an active conversation from expiring, independent of whether `updated_at` itself is fresh — verified directly (a match with a stale `updated_at` but a recent message does not expire).

### Lock System Enforcement — Implemented (Phase 3)

The illustrative `CHECK` constraint below (referencing another table in a `CHECK`) is **not valid Postgres** — flagged during Phase 1 planning and confirmed during implementation. The single-active-match invariant is enforced by a **trigger pair** on `public.matches` instead, in `lock_system_enforcement.sql`:

- `enforce_single_active_match()` (`BEFORE INSERT OR UPDATE`, `SECURITY DEFINER`) — rejects a match becoming `active` while either participant already has a *different* active match. Raises `ERRCODE = 'ST001'` / `HINT = 'ALREADY_LOCKED'` for the frontend to detect.
- `sync_active_match_id()` (`AFTER INSERT OR UPDATE`, `SECURITY DEFINER`) — mirrors `matches.status` into both participants' `users.active_match_id`: sets it on both when a match goes active, nulls it on both (guarded so it never clobbers a lock acquired elsewhere) when an active match closes.

Both are `SECURITY DEFINER` because they must read/write **both** participants' `users` rows — RLS alone only permits a caller's own row plus a matched partner's read, not a write to the other participant.

```sql
-- Non-functional illustrative constraint from the original PRD/planning pass — kept here
-- only to document why it was rejected, not as a pattern to follow.
ALTER TABLE users
ADD CONSTRAINT only_one_active_match
CHECK (
  (active_match_id IS NULL) OR
  (SELECT COUNT(*) FROM matches WHERE (user1_id = users.id OR user2_id = users.id) AND status = 'active') <= 1
);
```

Verified at both the SQL (trigger) and REST (End Match / manual termination) level — see `docs/development.md` Session 5.

**Hardened in `lock_system_hardening.sql` (Session 6)** after a bug-hunt audit found two gaps in the above:
- `protect_privileged_user_columns()` (`BEFORE UPDATE` on `public.users`, **`SECURITY INVOKER`** — deliberately *not* `DEFINER`, see the migration header and Session 6's dev log for why `DEFINER` would silently make this check a no-op) blocks direct client writes to `active_match_id`/`trust_score`, closing a self-unlock/ghosting hole that Phase 1's own-row `UPDATE` RLS policy left open.
- `enforce_single_active_match()` now takes `FOR UPDATE` row locks (ordered by `id`, to avoid deadlocks) on both participants before checking their lock state, closing a TOCTOU race where two concurrent match-creation attempts sharing a user could both pass the check before either committed.

---

## Edge Functions (Planned)

Deno/TypeScript functions for:
- Applying trust-score deltas from post-date surveys
- Running match-timeout cleanup (if not using `pg_cron`)
- Enforcing the `.edu` auth gate (if not using a trigger)

Each function is **modular and independently testable** (via `supabase functions serve` locally). No function should do two unrelated things.

Example structure:
```typescript
// functions/apply-trust-delta/index.ts
import { createClient } from "@supabase/supabase-js";

export default async (req: Request) => {
  const { userId, delta } = await req.json();
  const supabase = createClient(url, key);
  
  // Validate input, then call the SQL function
  const { data, error } = await supabase.rpc('apply_trust_delta', {
    user_id: userId,
    delta: delta,
  });
  
  return new Response(JSON.stringify({ data }), { status: 200 });
};
```

---

## Development Checklist

- [x] Supabase project created and database configured — local CLI stack (`StudyMatch/supabase/`), hosted project linking deferred to Phase 6
- [x] `public.users` table created with RLS enabled — Phase 1
- [x] `matches`/`messages`/`study_dates` tables created with RLS + grants — Phase 2 (`create_matches_messages_study_dates.sql`, `matches_messages_study_dates_rls.sql`); `users.active_match_id` FK closed; verified at SQL and REST level (see development.md Session 4)
- [x] `.edu` auth gate trigger deployed and tested — `edu_email_gate.sql`, verified against GoTrue v2.192.0; gated signup only until `edu_email_gate_on_update.sql` (Session 17) closed the post-signup `updateUser({email})` bypass — see development.md Session 17
- [x] Lock System single-active-match trigger on `matches` — Phase 3 (`lock_system_enforcement.sql`); verified at SQL and REST level, see development.md Session 5
- [x] Lock System hardened against direct client writes (`active_match_id`/`trust_score`) and a concurrent-match TOCTOU race — `lock_system_hardening.sql`; verified via SQL, a real two-session concurrency test, and REST, see development.md Session 6
- [x] Realtime publication configured on `matches` (and `messages`) tables — Phase 4 (`realtime_publication.sql`); verified via `pg_publication_tables` and a real websocket client test proving RLS gates delivery, see development.md Session 7
- [x] Trust-score function tested (apply delta without double-counts) — Phase 5 (`post_date_surveys.sql`): `submit_post_date_survey` RPC, not a standalone client-facing `apply_trust_delta`; only the +2/−25 tiers (the −10 last-minute-cancel tier is a flagged, deferred gap — see backend-dev.md's Trust Score Algorithm section); verified via SQL and real REST calls that a resubmission can't double-count, see development.md Session 14
- [x] Shadowban view created and accessible — Phase 4 (`discoverable_users_view.sql`); excludes `email`/`verification_code` (deviation from the doc's literal `SELECT *`, flagged in the migration and dev log); wired into `DiscoveryScreen.tsx`, see development.md Session 7
- [x] `discoverable_users` hardened: lock-status exclusion moved server-side (was client-filter-only), plus a `public.swipes` table so passed/matched candidates never reappear — `discoverable_users_hardening.sql`, see development.md Session 8
- [x] Real double opt-in match formation (PRD §4) — `mutual_match_formation.sql`: a `swipes`-table trigger forms the match only on a mutual right-swipe, with `authenticated`'s direct INSERT on `matches` revoked entirely (closes a bug where a single one-sided swipe instantly matched both users); see development.md Session 10
- [x] `users_select_swiped_right` RLS policy — `users_select_swiped_right.sql`: a user may read the profile of anyone they've swiped right on (outbound only, no "who liked me" leak), needed for Dashboard's Recently Liked section; see development.md Session 11
- [x] Match-timeout cron job deployed and tested — Phase 5 (`match_timeout_cron.sql`): `pg_cron` sweep every 15 min, reuses the existing Lock System trigger for the unlock rather than duplicating it; verified via direct invocation (stale match expires, active-conversation match doesn't), see development.md Session 14
- [ ] Edge Functions deployed and tested in isolation — not yet started
- [x] Data mapping layer in place (`src/data/mappers.ts`: users, matches, messages, study_dates) — Chat, Study Date Planner, Dashboard, My Profile, and Edit Profile all wired; every screen now reads/writes real data except photo upload (no Storage bucket yet), see development.md Session 13
- [ ] Real email verification (Supabase Auth OTP/magic-link) — Phase 1 currently uses a mock `verification_code` column (`'000000'`) as a placeholder, see `implemention.md`
- [x] RLS performance pass — `rls_performance_and_fk_indexes.sql`: all 14 `public` RLS policies now wrap `auth.uid()` in `(select auth.uid())` (Postgres's InitPlan optimization — evaluated once per query, not once per row; purely a planner change, doesn't affect the per-caller correctness already verified in Session 8), plus 2 previously-unindexed FK columns (`messages.sender_id`, `study_dates.proposed_by`) got indexes; see development.md Session 16

---

See [integration.md](integration.md) for how frontend queries and subscribes to this backend.
