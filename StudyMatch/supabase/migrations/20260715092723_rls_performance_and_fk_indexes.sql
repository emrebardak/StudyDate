-- Migration 16 — RLS auth.uid() InitPlan wrapping + 2 missing FK indexes
--
-- Prompted by the postgres-patterns skill's own diagnostic queries run against
-- this live schema, not a hypothetical: every one of the 14 RLS policies in
-- public used bare auth.uid()/auth.role() instead of (select auth.uid()), and
-- messages.sender_id / study_dates.proposed_by had no index at all (Postgres
-- never auto-indexes FK columns, only PK/UNIQUE ones).
--
-- Purely a query-planner optimization, not a correctness change: wrapping
-- auth.uid() in a scalar subquery lets Postgres evaluate it once per
-- statement (an InitPlan) instead of once per row scanned. This does NOT
-- change the per-caller re-evaluation behavior already empirically verified
-- for this schema (docs/development.md Session 8, re: discoverable_users) —
-- auth.uid() still reads request.jwt.claims fresh for whoever is actually
-- running the query; only WHEN within that single query it gets evaluated
-- changes. Every policy below is semantically identical to its previous
-- definition, just with auth.uid() wrapped.

-- ---------------------------------------------------------------------------
-- Missing FK indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_messages_sender_id     ON public.messages (sender_id);
CREATE INDEX idx_study_dates_proposed_by ON public.study_dates (proposed_by);

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
ALTER POLICY "matches_select_participant" ON public.matches
  USING ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id);

ALTER POLICY "matches_update_participant" ON public.matches
  USING ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id)
  WITH CHECK ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
ALTER POLICY "messages_select_participant" ON public.messages
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
        AND (select auth.uid()) IN (matches.user1_id, matches.user2_id)
    )
  );

ALTER POLICY "messages_insert_participant_active" ON public.messages
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
        AND (select auth.uid()) IN (matches.user1_id, matches.user2_id)
        AND matches.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- study_dates
-- ---------------------------------------------------------------------------
ALTER POLICY "study_dates_select_participant" ON public.study_dates
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = study_dates.match_id
        AND (select auth.uid()) IN (matches.user1_id, matches.user2_id)
    )
  );

ALTER POLICY "study_dates_insert_participant_active" ON public.study_dates
  WITH CHECK (
    proposed_by = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = study_dates.match_id
        AND (select auth.uid()) IN (matches.user1_id, matches.user2_id)
        AND matches.status = 'active'
    )
  );

ALTER POLICY "study_dates_update_participant" ON public.study_dates
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = study_dates.match_id
        AND (select auth.uid()) IN (matches.user1_id, matches.user2_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = study_dates.match_id
        AND (select auth.uid()) IN (matches.user1_id, matches.user2_id)
    )
  );

-- ---------------------------------------------------------------------------
-- swipes
-- ---------------------------------------------------------------------------
ALTER POLICY "swipes_select_own" ON public.swipes
  USING (swiper_id = (select auth.uid()));

ALTER POLICY "swipes_insert_own" ON public.swipes
  WITH CHECK (swiper_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- post_date_surveys
-- ---------------------------------------------------------------------------
ALTER POLICY "post_date_surveys_select_own" ON public.post_date_surveys
  USING (reviewer_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
ALTER POLICY "users_select_own" ON public.users
  USING ((select auth.uid()) = id);

ALTER POLICY "users_update_own" ON public.users
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "users_select_matched" ON public.users
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE (matches.user1_id = (select auth.uid()) AND matches.user2_id = users.id)
         OR (matches.user2_id = (select auth.uid()) AND matches.user1_id = users.id)
    )
  );

ALTER POLICY "users_select_swiped_right" ON public.users
  USING (
    EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swipes.swiper_id = (select auth.uid())
        AND swipes.target_id = users.id
        AND swipes.direction = 'right'
    )
  );
