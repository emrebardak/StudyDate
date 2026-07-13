# Backend Developer Guide

This guide covers backend development (Supabase, PostgreSQL, Edge Functions) for StudyMatch. Designed primarily for the [studymatch-supabase](./../.claude/agents/studymatch-supabase.md) and [studymatch-logic](./../.claude/agents/studymatch-logic.md) subagents.

> **Status**: No backend code exists yet. The following sections describe the planned structure and serve as placeholders for implementation.

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

### `.edu` Email Gate

Reject registration if email does not end in `.edu` or `.edu.tr`. Enforce at the database level via trigger or Supabase Auth hook (verify current mechanism with Supabase docs).

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

## Realtime Configuration (Planned)

Publish the `matches` table so frontend can subscribe to `active_match_id` and match-status changes instantly.

```sql
-- Enable publication (exact syntax depends on Supabase version)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
```

**Important**: Confirm RLS policies apply to realtime subscriptions — Realtime does not bypass RLS, but double-check the policy covers the subscribed columns/rows.

---

## Business Logic (Planned)

### Trust Score Algorithm

Implemented as a `plpgsql` function (or Edge Function calling one). Increments/decrements based on post-date survey outcomes:

- **+2**: Successful meeting (user confirms)
- **−10**: Last-minute cancellation
- **−25**: No-show / ghosting

**Requirement**: Mutations are transactional (atomic `UPDATE ... SET trust_score = trust_score + delta WHERE id = ...` to prevent double-counts on retries).

```sql
-- Example function
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

**Validation**: Reject malformed or duplicate survey submissions before any score mutation runs — fail closed, not open.

**Documentation**: Use named constants for point values and thresholds so a future PRD change is a one-line edit, not a grep-and-replace.

### Shadowban Filtering

Users with `trust_score < 60` are invisible in the Discovery matching pool but can still use the app normally (not banned, just hidden).

Implement as a PostgreSQL **View** (`discoverable_users`) that Discovery queries read from, rather than sprinkling `WHERE trust_score >= 60` across multiple query sites:

```sql
CREATE VIEW discoverable_users AS
  SELECT * FROM users WHERE trust_score >= 60;
```

Frontend's Discovery screen reads from this view instead of the raw `users` table. Confirm this view is actually used by the frontend's data-access layer.

### Match Timeout Cron Job

Runs periodically (e.g., every 15 minutes) to:
1. Find `matches` where `status = 'active'` and no `messages` exist with `created_at` in the last 12 hours
2. Set `status = 'expired'`
3. Nullify `active_match_id` on both `user1_id` and `user2_id`

**Requirement**: The entire operation is **atomic** (single transaction) — no partial unlocks.

Implemented as `pg_cron` job (if available on the Supabase plan) or a scheduled Edge Function:

```sql
-- Example: using pg_cron (verify availability)
SELECT cron.schedule('match-timeout-sweep', '*/15 * * * *', $$
  UPDATE matches
  SET status = 'expired'
  WHERE status = 'active'
  AND updated_at < NOW() - INTERVAL '12 hours'
  AND NOT EXISTS (
    SELECT 1 FROM messages
    WHERE messages.match_id = matches.id
    AND messages.created_at > NOW() - INTERVAL '12 hours'
  );

  UPDATE users
  SET active_match_id = NULL
  WHERE active_match_id IN (
    SELECT id FROM matches WHERE status = 'expired'
  );
$$);
```

**Coordination**: If the Lock System's single-active-match constraint is enforced by a DB trigger, this cron job must go through the same code path/trigger rather than writing to `active_match_id` directly and bypassing the invariant.

### Lock System Enforcement

The single-active-match constraint (`active_match_id` on `users`) must be enforceable by the schema itself, not just application logic.

Approach: a constraint, trigger, or transaction pattern that prevents a user from acquiring a second `active_match_id` while one is already set.

```sql
-- Example: constraint approach
ALTER TABLE users
ADD CONSTRAINT only_one_active_match
CHECK (
  (active_match_id IS NULL) OR
  (SELECT COUNT(*) FROM matches WHERE (user1_id = users.id OR user2_id = users.id) AND status = 'active') <= 1
);
```

**Flag explicitly during implementation**: If the database alone cannot guarantee this, application-level enforcement is required.

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

- [ ] Supabase project created and database configured
- [ ] Database schema deployed with RLS enabled on all tables
- [ ] `.edu` auth gate trigger/hook deployed and tested
- [ ] Realtime publication configured on `matches` table
- [ ] Trust-score function tested (apply delta without double-counts)
- [ ] Shadowban view created and accessible
- [ ] Match-timeout cron job deployed and tested
- [ ] Edge Functions deployed and tested in isolation
- [ ] Data mapping layer documented (frontend consumes snake_case → maps to camelCase)

---

See [integration.md](integration.md) for how frontend queries and subscribes to this backend.
