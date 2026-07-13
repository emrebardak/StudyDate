-- Migration 6 — Row Level Security on matches, messages, study_dates (Phase 2)
--
-- Default-deny on all three, then grant exactly what participants need. Phase 1
-- lesson applied throughout: RLS policies are never evaluated unless the role first
-- holds base table DML privileges — this CLI's default privileges grant authenticated
-- only TRUNCATE/REFERENCES/TRIGGER, so every table gets an explicit GRANT here.
-- anon gets nothing on any of these tables.

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.matches TO authenticated;

-- Participants can read their own matches.
CREATE POLICY "matches_select_participant"
  ON public.matches
  FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

-- The initiator is always user1_id: you can create a match FROM yourself, never
-- on someone else's behalf. (The single-active-match invariant — rejecting a new
-- match while either side is already locked — is Phase 3's trigger, not RLS.)
CREATE POLICY "matches_insert_initiator"
  ON public.matches
  FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

-- Participants can update their matches: reveal flags, manual termination (PRD §5).
CREATE POLICY "matches_update_participant"
  ON public.matches
  FOR UPDATE
  USING (auth.uid() IN (user1_id, user2_id))
  WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- No DELETE policy: matches are completed/terminated/expired, never client-deleted.

COMMENT ON POLICY "matches_insert_initiator" ON public.matches IS 'Initiator is always user1_id. Lock System single-active-match enforcement arrives as a trigger in Phase 3.';

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.messages TO authenticated;

-- Read messages only from matches you are in — authorization always flows through
-- the parent matches row (docs/backend-dev.md pattern), never a denormalized copy.
CREATE POLICY "messages_select_participant"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
        AND auth.uid() IN (matches.user1_id, matches.user2_id)
    )
  );

-- Send only as yourself, only into your own ACTIVE match. Closed matches
-- (completed/terminated/expired) are read-only history.
CREATE POLICY "messages_insert_participant_active"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
        AND auth.uid() IN (matches.user1_id, matches.user2_id)
        AND matches.status = 'active'
    )
  );

-- No UPDATE/DELETE policies: messages are immutable once sent.

-- ---------------------------------------------------------------------------
-- study_dates
-- ---------------------------------------------------------------------------
ALTER TABLE public.study_dates ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.study_dates TO authenticated;

CREATE POLICY "study_dates_select_participant"
  ON public.study_dates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = study_dates.match_id
        AND auth.uid() IN (matches.user1_id, matches.user2_id)
    )
  );

-- Propose only as yourself, only within your own ACTIVE match.
CREATE POLICY "study_dates_insert_participant_active"
  ON public.study_dates
  FOR INSERT
  WITH CHECK (
    proposed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = study_dates.match_id
        AND auth.uid() IN (matches.user1_id, matches.user2_id)
        AND matches.status = 'active'
    )
  );

-- Either participant can update (accept / edit / cancel — PRD §6 approval flow).
CREATE POLICY "study_dates_update_participant"
  ON public.study_dates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = study_dates.match_id
        AND auth.uid() IN (matches.user1_id, matches.user2_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = study_dates.match_id
        AND auth.uid() IN (matches.user1_id, matches.user2_id)
    )
  );

-- No DELETE policy: dates are cancelled via status, not removed.

-- ---------------------------------------------------------------------------
-- users — one Phase 2 addition: you may read your match partner's profile.
-- Chat/StudentProfile screens need the partner's row (name, badges, photos for the
-- reveal flow). Discovery-wide reads remain deferred to Phase 4's shadowban-aware
-- discoverable_users view, per Migration 4's stated intent.
-- ---------------------------------------------------------------------------
CREATE POLICY "users_select_matched"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE (matches.user1_id = auth.uid() AND matches.user2_id = users.id)
         OR (matches.user2_id = auth.uid() AND matches.user1_id = users.id)
    )
  );

COMMENT ON POLICY "users_select_matched" ON public.users IS 'Phase 2: read the profile of anyone you share a match with. Discovery-wide reads come in Phase 4 via discoverable_users.';
