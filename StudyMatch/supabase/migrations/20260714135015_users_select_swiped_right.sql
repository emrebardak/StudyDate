-- Migration 13 — read access for the Dashboard's "Recently Liked" section
--
-- DashboardScreen shows the profiles of people the current user has recently
-- swiped right on (their outbound likes). No such read path exists today:
-- users_select_own/users_select_matched (Migration 4/6) only cover your own
-- row and a matched partner's row, and discoverable_users deliberately
-- EXCLUDES anyone already swiped on (Migration 11's NOT EXISTS clause), so it
-- can't be reused here either.
--
-- This is not a new privacy exposure: DiscoveryScreen already rendered this
-- same profile data (name/university/department/year) unblurred on the swipe
-- card, sourced from discoverable_users, before the swipe was ever recorded.
-- Photos remain unaffected — progressive-disclosure photo blur is a separate,
-- still-unimplemented later phase (see DiscoveryScreen's CardFace comment).
--
-- Scope is deliberately one-directional and outbound-only: a user can see
-- someone THEY swiped right on, never who swiped right on THEM (no "who
-- liked me" leak), and never for a left swipe/pass.
CREATE POLICY "users_select_swiped_right"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swipes.swiper_id = auth.uid()
        AND swipes.target_id = users.id
        AND swipes.direction = 'right'
    )
  );

COMMENT ON POLICY "users_select_swiped_right" ON public.users IS 'Phase: Dashboard Recently Liked. Outbound-only — read the profile of anyone the caller swiped right on, never the reverse.';
