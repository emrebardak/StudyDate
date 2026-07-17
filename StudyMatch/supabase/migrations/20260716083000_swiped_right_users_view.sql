-- Migration 22 — swiped_right_users view (column-scoped replacement for
-- users_select_swiped_right)
--
-- Found while verifying Migration 21's matched_users fix, not in the
-- original finding: dropping users_select_matched alone did NOT actually
-- close the reported gap. REST-level proof — a real mutual match (A and B,
-- via the Session 10 double-opt-in swipe mechanism) still let A read B's
-- verification_code directly from public.users after Migration 21 was
-- applied. Root cause: users_select_swiped_right (Migration 13) is a SECOND
-- row-only RLS policy with the identical structural flaw — no column
-- restriction, same table-wide GRANT SELECT from Migration 4 — and a match
-- can ONLY form via mutual right-swipes (Migration 12), so every currently-
-- matched pair necessarily also satisfies users_select_swiped_right in BOTH
-- directions. Fixing users_select_matched without also fixing this policy
-- leaves the exact same verification_code exposure open through a second
-- door for the exact scenario the original finding described.
--
-- users_select_swiped_right's own scope is broader than "matched," though
-- (outbound-only: anyone the caller swiped right on, reciprocated or not —
-- see Migration 13's "Recently Liked" rationale), so this is deliberately
-- its own view with its own predicate, not folded into matched_users. The
-- two product concepts (matched vs. merely swiped-right-on) happen to
-- overlap today because of how matches form, but are not the same thing and
-- may not always coincide if match formation ever changes.
--
-- Same mechanism, same reasoning, same column list as Migration 21's
-- matched_users (itself reusing discoverable_users' already-vetted list
-- verbatim) — see that migration's header for the full explanation of why a
-- view (not column-level GRANT/REVOKE, which is role-wide and would also
-- break the owner's own-row verification_code read) is the correct fix, and
-- why a plain non-security_invoker view with auth.uid() in the WHERE clause
-- works (empirically verified Session 7/8).

DROP POLICY "users_select_swiped_right" ON public.users;

CREATE VIEW public.swiped_right_users
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
  SELECT 1 FROM public.swipes
  WHERE swipes.swiper_id = auth.uid()
    AND swipes.target_id = users.id
    AND swipes.direction = 'right'
);

GRANT SELECT ON public.swiped_right_users TO authenticated;

COMMENT ON VIEW public.swiped_right_users IS 'Column-scoped replacement for the dropped users_select_swiped_right RLS policy (Migration 13) — outbound-only: read the profile of anyone the caller swiped right on, excluding email/verification_code/verification_code_expires_at/email_verified. Same column list as matched_users/discoverable_users, reused verbatim. Deliberately not security_invoker — see Migration 21 header.';
