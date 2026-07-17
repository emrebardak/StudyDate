-- Migration 23 — Phase 7 (schema half): birthdate + viewer-relative
-- age / same_city / match_score on discoverable_users
--
-- Per implemention.md Phase 7 (decisions confirmed there, not re-made here):
-- both filtering and ranking; score computed in SQL inside discoverable_users,
-- not client-side; age from a new nullable birthdate column (no backfill, no
-- native date-picker — frontend composes a DATE from plain numeric inputs);
-- "distance" is same-city via the existing city column, no GPS.
--
-- This migration is the SCHEMA HALF only — the frontend wiring (filters,
-- score badge, EditProfileScreen birthdate input) is Phase 7's other half,
-- not touched here.
--
-- NULL-safety is EXPLICIT by design (task requirement): birthdate/city are
-- unbackfilled, so every existing user has them NULL today. An unknown value
-- on EITHER side contributes exactly 0 points to match_score, makes same_city
-- false, and makes age NULL — it never NULLs out the whole score, never
-- excludes the row, never empties the deck. Filtering on these is the
-- frontend's job and only when the caller actively sets a filter.
--
-- Privacy: raw birthdate is NOT exposed on the view — only the derived age —
-- following the same precedent as excluding email/verification_code
-- (Migration 10). matched_users / swiped_right_users (Migrations 21/22) use
-- explicit column lists written before this column existed, so they exclude
-- birthdate automatically — that's precisely why those views used explicit
-- lists instead of SELECT *; no change needed there.
--
-- Viewer-relative columns: the view (plain, non-security_invoker, evaluated
-- with the postgres owner's privileges) LEFT JOINs the caller's own row via
-- auth.uid(). auth.uid() re-evaluates per querying session inside such a view
-- — empirically proven in Session 8 for the swipe-history NOT EXISTS, reused
-- here for SELECT-list columns. LEFT JOIN (not inner): if the viewer row is
-- somehow absent, candidates still appear with score 0 / same_city false
-- rather than the deck vanishing. Reading the caller's own row through the
-- owner's privileges exposes nothing: users_select_own already grants them
-- that row directly.

-- ---------------------------------------------------------------------------
-- birthdate — nullable, no backfill. Client-writable via users_update_own
-- (an ordinary profile field, like city — deliberately NOT added to
-- protect_privileged_user_columns).
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN birthdate DATE;

COMMENT ON COLUMN public.users.birthdate IS 'Nullable, unbackfilled (Phase 7). Never exposed raw on any view — discoverable_users derives age from it; matched_users/swiped_right_users exclude it via their explicit column lists.';

-- ---------------------------------------------------------------------------
-- compute_match_score — the PRD-agreed additive weights as named constants,
-- following Session 20's trust-score named-constants convention (PL/pgSQL
-- CONSTANTs are the project's one mechanism for genuinely named values; a
-- view body can't declare constants, which is why this is a function rather
-- than inline arithmetic). Takes both rows as public.users composites so the
-- signal list can grow without re-plumbing 14 scalar parameters.
--
-- IMMUTABLE: output depends only on its inputs (unnest over its own array
-- arguments reads no tables).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_match_score(
  p_viewer    public.users,
  p_candidate public.users
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  -- Weights per implemention.md Phase 7's table. Additive-only: zero known
  -- overlap scores 0, never negative.
  c_same_department_points CONSTANT INTEGER := 30;
  c_same_university_points CONSTANT INTEGER := 15;
  c_same_city_points       CONSTANT INTEGER := 10;
  c_shared_tag_points      CONSTANT INTEGER := 8;
  c_shared_tags_cap        CONSTANT INTEGER := 5;   -- 5 shared × 8 = max 40 from tags
  c_same_pacing_points     CONSTANT INTEGER := 10;
  c_same_audio_points      CONSTANT INTEGER := 5;
  c_same_fuel_points       CONSTANT INTEGER := 5;
  c_max_score              CONSTANT INTEGER := 100;

  v_score       INTEGER := 0;
  v_shared_tags INTEGER := 0;
BEGIN
  -- Every comparison guards both sides against NULL explicitly (task
  -- requirement: explicit, not implicit — even though `NULL = x` inside IF
  -- would happen to behave the same way, the intent must be readable).
  IF p_viewer.department IS NOT NULL AND p_candidate.department IS NOT NULL
     AND p_viewer.department = p_candidate.department THEN
    v_score := v_score + c_same_department_points;
  END IF;

  IF p_viewer.university IS NOT NULL AND p_candidate.university IS NOT NULL
     AND p_viewer.university = p_candidate.university THEN
    v_score := v_score + c_same_university_points;
  END IF;

  IF p_viewer.city IS NOT NULL AND p_candidate.city IS NOT NULL
     AND p_viewer.city = p_candidate.city THEN
    v_score := v_score + c_same_city_points;
  END IF;

  -- Shared current_tags, deduplicated, capped. COALESCE covers both the
  -- column's NOT NULL default and the all-NULL composite a LEFT JOIN miss
  -- produces for p_viewer.
  SELECT COUNT(DISTINCT t) INTO v_shared_tags
    FROM unnest(COALESCE(p_viewer.current_tags, '{}')) AS t
   WHERE t = ANY (COALESCE(p_candidate.current_tags, '{}'));
  v_score := v_score + LEAST(v_shared_tags, c_shared_tags_cap) * c_shared_tag_points;

  IF p_viewer.study_pacing IS NOT NULL AND p_candidate.study_pacing IS NOT NULL
     AND p_viewer.study_pacing = p_candidate.study_pacing THEN
    v_score := v_score + c_same_pacing_points;
  END IF;

  IF p_viewer.audio_environment IS NOT NULL AND p_candidate.audio_environment IS NOT NULL
     AND p_viewer.audio_environment = p_candidate.audio_environment THEN
    v_score := v_score + c_same_audio_points;
  END IF;

  IF p_viewer.study_fuel IS NOT NULL AND p_candidate.study_fuel IS NOT NULL
     AND p_viewer.study_fuel = p_candidate.study_fuel THEN
    v_score := v_score + c_same_fuel_points;
  END IF;

  -- Uncapped maximum is 115 (30+15+10+40+10+5+5) — clamp per the spec.
  RETURN LEAST(v_score, c_max_score);
END;
$$;

-- Unlike table access (checked against the view OWNER), EXECUTE on functions
-- a view calls is checked against the QUERYING user — so authenticated needs
-- this grant or the view itself errors for every client. Harmless to expose:
-- pure computation over caller-supplied values, reads no data.
REVOKE EXECUTE ON FUNCTION public.compute_match_score(public.users, public.users) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_match_score(public.users, public.users) TO authenticated;

COMMENT ON FUNCTION public.compute_match_score(public.users, public.users) IS 'Phase 7 additive compatibility score, 0-100 (LEAST-clamped; raw max 115). Named-constant weights: department 30, university 15, city 10, shared tag 8 (cap 5), pacing 10, audio 5, fuel 5. Explicitly NULL-safe: unknown on either side contributes 0.';

-- ---------------------------------------------------------------------------
-- discoverable_users — same 21 columns in the same order (CREATE OR REPLACE
-- VIEW requires the existing column prefix unchanged; the three new columns
-- append), same three predicates as Migration 11, same security_barrier,
-- still not security_invoker, still excludes email/verification_code — and
-- now also implicitly the Migration 20 columns (verification_code_expires_at,
-- email_verified) and raw birthdate, none of which appear in the list.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.discoverable_users
WITH (security_barrier = true)
AS
SELECT
  u.id,
  u.name,
  u.university,
  u.department,
  u.grade,
  u.year,
  u.trust_score,
  u.badges,
  u.current_goal_text,
  u.current_tags,
  u.audio_environment,
  u.study_pacing,
  u.study_fuel,
  u.photo_url,
  u.photos,
  u.bio,
  u.availability,
  u.city,
  u.active_match_id,
  u.created_at,
  u.updated_at,
  -- Derived age only, never raw birthdate. NULL when birthdate unset.
  date_part('year', age(u.birthdate))::int AS age,
  -- Strict boolean: false (not NULL) when either side's city is unknown.
  (viewer.city IS NOT NULL AND u.city IS NOT NULL AND u.city = viewer.city) AS same_city,
  -- Viewer-relative 0-100; 0 when the viewer row is absent (LEFT JOIN miss).
  public.compute_match_score(viewer, u) AS match_score
FROM public.users u
LEFT JOIN public.users viewer ON viewer.id = auth.uid()
WHERE u.trust_score >= 60
  AND u.active_match_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swipes.swiper_id = auth.uid()
      AND swipes.target_id = u.id
  );

COMMENT ON VIEW public.discoverable_users IS 'Shadowban + Lock System + swipe-history filtered Discovery read surface (Migration 11 predicates unchanged), now with viewer-relative age/same_city/match_score (Phase 7, Migration 23). Excludes email/verification_code/verification_code_expires_at/email_verified and raw birthdate. Deliberately not security_invoker.';
