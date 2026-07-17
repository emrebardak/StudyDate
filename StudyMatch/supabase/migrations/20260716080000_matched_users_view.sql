-- Migration 21 — matched_users view (column-scoped replacement for
-- users_select_matched)
--
-- Code-review finding: users_select_matched (Migration 6) is a row-level-only
-- RLS policy on public.users with no column restriction. Combined with
-- Migration 4's table-wide `GRANT SELECT ON public.users TO authenticated`,
-- ANY column is selectable for a matched partner's row — including
-- verification_code and verification_code_expires_at, added later by
-- Migration 20, which the Migration 6 author obviously couldn't have
-- excluded. A matched partner could `select=verification_code` directly and
-- read the other person's live verification code, even though no screen
-- currently requests those columns.
--
-- This is the exact class of gap discoverable_users (Migration 10) already
-- solved for the Discovery candidate pool, by using an explicit column list
-- instead of exposing public.users' RLS surface directly — that fix was
-- simply never extended to the matched-partner case. RLS is row-level only;
-- it cannot restrict columns. Column-level GRANT/REVOKE was considered and
-- rejected: it's role-wide, not row-scoped, so REVOKE SELECT
-- (verification_code) FROM authenticated would ALSO block
-- RegisterEmailCodeScreen.tsx's legitimate own-row read (users_select_own,
-- same role, same table). A view is the only mechanism that can tell "my own
-- row" and "my match partner's row" apart while restricting columns
-- differently for each — and Migration 4's users_select_own/users_update_own
-- policies (and the underlying table GRANT) are untouched by this migration.
--
-- Fix: DROP the users_select_matched policy entirely (closing the actual
-- bypass — a client could otherwise skip this view and hit public.users
-- directly, exactly the "close the bypass, not just add a parallel path"
-- pattern Sessions 8 and 10 already established), replaced by
-- matched_users, a plain (non-security_invoker) view reusing
-- discoverable_users' exact vetted column list — same exclusions: email,
-- verification_code, plus the two columns Migration 20 added
-- (verification_code_expires_at, email_verified), none of which any
-- consumer of a matched partner's profile has ever read. Reusing that list
-- verbatim is deliberate: those columns were already judged safe to expose
-- to ANY authenticated user via discoverable_users (a strictly WIDER
-- audience than "someone you're already matched with"), so exposing the
-- same set to the narrower matched-partner audience cannot introduce a new
-- exposure.
--
-- View mechanics mirror discoverable_users exactly (see that migration's
-- header for the full reasoning, empirically verified in Session 7/8): not
-- security_invoker, so it evaluates with the view owner's (postgres)
-- privileges and can read across users despite public.users' own-row RLS;
-- auth.uid() inside the WHERE clause is still evaluated live per querying
-- session (Session 8 confirmed this isn't baked in at view-creation time);
-- security_barrier = true guards against a caller-supplied filter being
-- pushed ahead of the WHERE clause as a side channel.
--
-- The match-visibility condition below is copied verbatim from the dropped
-- policy — including matching on ANY match status (not just 'active'),
-- preserving exact existing semantics. Whether ex-partners from a
-- completed/terminated/expired match should keep read access at all is a
-- separate, pre-existing question this migration does not change or
-- re-litigate — it only restricts WHICH COLUMNS are visible under whatever
-- rows were already visible.

DROP POLICY "users_select_matched" ON public.users;

CREATE VIEW public.matched_users
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
WHERE EXISTS (
  SELECT 1 FROM public.matches
  WHERE (matches.user1_id = auth.uid() AND matches.user2_id = users.id)
     OR (matches.user2_id = auth.uid() AND matches.user1_id = users.id)
);

GRANT SELECT ON public.matched_users TO authenticated;

COMMENT ON VIEW public.matched_users IS 'Column-scoped replacement for the dropped users_select_matched RLS policy (Migration 6) — read the profile of anyone you share a match with, excluding email/verification_code/verification_code_expires_at/email_verified. Same column list as discoverable_users (Migration 10) reused verbatim: already vetted for a wider audience. Deliberately not security_invoker — see migration header.';
