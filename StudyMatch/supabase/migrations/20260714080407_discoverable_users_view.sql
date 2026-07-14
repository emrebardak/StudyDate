-- Migration 10 — discoverable_users shadowban view (Phase 4)
--
-- Users with trust_score < 60 are hidden from Discovery's matching pool but function
-- normally everywhere else in the app (PRD §8 — shadowban, not a ban). Discovery reads
-- from this view instead of public.users so the shadowban rule lives in one place.
--
-- DEVIATION from the literal `SELECT * FROM public.users` in docs/backend-dev.md:
-- this view uses an explicit column list that excludes `email` and `verification_code`.
-- `SELECT *` would broadcast every discoverable user's real email address and mock
-- auth verification code to any authenticated client via Discovery — neither is used
-- by the frontend User type (src/data/mappers.ts's mapUserFromAPI never reads either),
-- so there's no product reason to expose them and a clear reason not to. Flagged here
-- the same way Session 6 flagged its SECURITY DEFINER deviation, rather than silently
-- diverging from the doc.
--
-- Cross-user reads without loosening public.users' own-row RLS (Phase 1's
-- users_update_own / users_select_own, deliberately left narrow until this view
-- existed): a plain Postgres view (the default — no `security_invoker`) evaluates its
-- query using the VIEW OWNER's privileges, not the querying role's. Since this view is
-- created by the migration-running role (postgres, a superuser that bypasses RLS
-- entirely), the view can read every row in public.users regardless of who queries the
-- view — exactly the classic "security-definer view" pattern, and exactly why we do
-- NOT want `security_invoker = true` here (that PG15+ option would flip evaluation
-- back to the QUERYING user's own RLS, i.e. right back to Phase 1's own-row-only
-- restriction, defeating the point of this view). Verified empirically, not just by
-- documentation: see docs/development.md Session 7.
--
-- `security_barrier = true` is still applied — a different, complementary hardening:
-- it stops the query planner from pushing a caller-supplied qualifier (e.g. a
-- WHERE clause containing a leaky/error-throwing expression) ahead of this view's own
-- trust_score filter, which could otherwise let a client infer values from
-- shadowbanned (filtered-out) rows via a side channel.
--
-- Only `authenticated` gets SELECT — `anon` gets nothing, consistent with every other
-- table/view so far.

CREATE VIEW public.discoverable_users
WITH (security_barrier = true)
AS
SELECT
  id,
  name,
  university,
  department,
  grade,
  year,
  trust_score,
  badges,
  current_goal_text,
  current_tags,
  audio_environment,
  study_pacing,
  study_fuel,
  photo_url,
  photos,
  bio,
  availability,
  city,
  active_match_id,
  created_at,
  updated_at
FROM public.users
WHERE trust_score >= 60;

GRANT SELECT ON public.discoverable_users TO authenticated;

COMMENT ON VIEW public.discoverable_users IS 'Shadowban-filtered Discovery read surface (PRD §8: trust_score < 60 hidden from matching, not banned). Deliberately not security_invoker so it can read across users despite public.users'' own-row RLS. Excludes email/verification_code (not in docs'' literal SELECT * — see migration header for why).';
