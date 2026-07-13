-- Migration 5 — core relational tables: matches, messages, study_dates (Phase 2)
--
-- Schema per docs/backend-dev.md and PRD §9. snake_case columns; the camelCase
-- frontend interfaces (Match/Message/StudyDate in src/types/index.ts) map to these
-- at src/data/mappers.ts — never by direct field-name copy.
--
-- Also closes the forward reference left open in Migration 1: users.active_match_id
-- now gets its real FK to matches.

-- ---------------------------------------------------------------------------
-- matches — one row per formed match (PRD §5: the Lock System's unit of work)
-- ---------------------------------------------------------------------------
CREATE TABLE public.matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id        UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  user2_id        UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,

  -- Lifecycle: active (locked chat) → completed | terminated (manual end) | expired (timeout sweep).
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'completed', 'terminated', 'expired')),

  -- Progressive disclosure (PRD §5): photos unblur only when BOTH flip to true.
  user1_revealed  BOOLEAN NOT NULL DEFAULT FALSE,
  user2_revealed  BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Bumped on activity; the Phase 5 timeout sweep reads this to expire stale matches.
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user can't match with themselves.
  CONSTRAINT matches_distinct_users CHECK (user1_id <> user2_id)
);

CREATE INDEX idx_matches_user1_id ON public.matches (user1_id);
CREATE INDEX idx_matches_user2_id ON public.matches (user2_id);
CREATE INDEX idx_matches_status   ON public.matches (status);

-- Close Migration 1's forward reference: the Lock System pointer is now a real FK.
-- ON DELETE SET NULL: if a match row is ever hard-deleted, the lock releases rather
-- than leaving a dangling pointer that would keep Discovery locked forever.
ALTER TABLE public.users
  ADD CONSTRAINT users_active_match_id_fkey
  FOREIGN KEY (active_match_id) REFERENCES public.matches (id) ON DELETE SET NULL;

COMMENT ON TABLE  public.matches IS 'One row per formed match. status=active is the Lock System state that locks Discovery for both users. Single-active-match invariant is enforced by a trigger in Phase 3.';
COMMENT ON COLUMN public.matches.updated_at IS 'Bumped on activity; Phase 5 timeout sweep expires matches stale past 12h.';

-- ---------------------------------------------------------------------------
-- messages — chat messages within a match (PRD §5)
-- ---------------------------------------------------------------------------
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   UUID NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (length(content) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_match_id   ON public.messages (match_id);
CREATE INDEX idx_messages_created_at ON public.messages (created_at DESC);

COMMENT ON TABLE public.messages IS 'Chat messages, scoped to a match. Access is always authorized via the parent matches row (RLS subquery), never a denormalized copy.';

-- ---------------------------------------------------------------------------
-- study_dates — proposed/accepted physical meetups (PRD §6)
-- ---------------------------------------------------------------------------
CREATE TABLE public.study_dates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  proposed_by    UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  location       TEXT,
  scheduled_time TIMESTAMPTZ,
  focus_subject  TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_dates_match_id ON public.study_dates (match_id);

COMMENT ON TABLE public.study_dates IS 'Study Date planner rows (PRD §6): one user proposes, the other accepts/edits.';
