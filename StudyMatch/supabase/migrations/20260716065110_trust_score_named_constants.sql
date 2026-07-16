-- Migration 19 — named constants for trust-score point values/thresholds
--
-- docs/backend-dev.md states the intent explicitly: "Use named constants for
-- point values and thresholds so a future PRD change is a one-line edit, not
-- a grep-and-replace." The code didn't follow it — the deltas were bare
-- literals: submit_post_date_survey()'s `CASE WHEN p_met THEN 2 ELSE -25 END`
-- (Migrations 14 and 18), cancel_study_date()'s `trust_score - 10`
-- (Migration 18), and discoverable_users' `WHERE trust_score >= 60`
-- (Migrations 10 and 11). This migration fixes all three, with two different
-- mechanisms because functions and views don't have the same capabilities:
--
--   * submit_post_date_survey() / cancel_study_date(): PL/pgSQL's native
--     `CONSTANT` declaration in each function's own DECLARE block.
--   * discoverable_users: Postgres views have no DECLARE block and cannot
--     hold local constants — there's no equivalent mechanism. Building a
--     lookup table for a single threshold value would be over-engineering
--     for a schema where nothing else needs one (CLAUDE.md: don't add
--     complexity beyond what's needed). Named instead via a same-file SQL
--     comment directly above the WHERE clause, citing the same value and PRD
--     section a real constant would.
--
-- ACCEPTED LIMITATION, flagged here the same way this project has flagged
-- every other deliberate deviation (discoverable_users' excluded columns,
-- SECURITY INVOKER vs DEFINER choices, etc.): PL/pgSQL constants are
-- function-local — there is no shared/importable constant across separate
-- function bodies the way a frontend constants module works. That's not
-- actually a problem for the three values here (no single point value is
-- used by both functions — survey has +2/-25, cancellation has -10, no
-- overlap), but it does mean CREATE OR REPLACE FUNCTION's existing
-- constraint keeps applying going forward: replacing a function requires
-- restating its ENTIRE body, so any future change to either function will
-- re-paste these same CONSTANT declarations into that migration's text too,
-- verbatim, exactly as Migration 18 already had to re-paste Migration 14's
-- literal `2`/`-25` when it added the cancellation-status check. Postgres has
-- no incremental "patch this one line of a function" DDL — not a bug to
-- solve, just how CREATE OR REPLACE FUNCTION works.
--
-- No point values change. Verified via db reset + the existing REST scripts
-- unmodified — same +2/-25/-10/60 behavior, just named instead of bare.

-- ---------------------------------------------------------------------------
-- submit_post_date_survey — identical to Migration 18's version except the
-- CASE branches now reference named constants instead of bare 2 / -25.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_post_date_survey(
  p_study_date_id UUID,
  p_met           BOOLEAN,
  p_environment   TEXT DEFAULT NULL,
  p_badge         TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_survey_met_delta    CONSTANT INTEGER := 2;   -- PRD §7: successful meeting
  c_survey_no_show_delta CONSTANT INTEGER := -25; -- PRD §7: no-show / ghosting
  v_user1_id       UUID;
  v_user2_id       UUID;
  v_scheduled_time TIMESTAMPTZ;
  v_sd_status      TEXT;
  v_target         UUID;
  v_delta          INTEGER;
BEGIN
  SELECT m.user1_id, m.user2_id, sd.scheduled_time, sd.status
    INTO v_user1_id, v_user2_id, v_scheduled_time, v_sd_status
    FROM public.study_dates sd
    JOIN public.matches m ON m.id = sd.match_id
   WHERE sd.id = p_study_date_id
     AND auth.uid() IN (m.user1_id, m.user2_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study date not found or you are not a participant of its match'
      USING ERRCODE = 'ST005', HINT = 'NOT_PARTICIPANT';
  END IF;

  IF v_sd_status = 'cancelled' THEN
    RAISE EXCEPTION 'This study date was cancelled in advance - it cannot be surveyed'
      USING ERRCODE = 'ST011', HINT = 'ALREADY_CANCELLED';
  END IF;

  IF v_scheduled_time IS NULL OR v_scheduled_time > NOW() THEN
    RAISE EXCEPTION 'This study date has not happened yet'
      USING ERRCODE = 'ST006', HINT = 'NOT_YET_DUE';
  END IF;

  IF p_met AND p_environment IS NULL THEN
    RAISE EXCEPTION 'environment is required when met is true'
      USING ERRCODE = '22023';
  END IF;

  v_target := CASE WHEN v_user1_id = auth.uid() THEN v_user2_id ELSE v_user1_id END;

  INSERT INTO public.post_date_surveys (study_date_id, reviewer_id, target_id, met, environment, badge)
  VALUES (p_study_date_id, auth.uid(), v_target, p_met, p_environment, p_badge);

  v_delta := CASE WHEN p_met THEN c_survey_met_delta ELSE c_survey_no_show_delta END;

  UPDATE public.users
     SET trust_score = GREATEST(trust_score + v_delta, 0)
   WHERE id = v_target;

  IF p_badge IS NOT NULL THEN
    UPDATE public.users
       SET badges = jsonb_set(badges, ARRAY[p_badge], to_jsonb(COALESCE((badges ->> p_badge)::int, 0) + 1))
     WHERE id = v_target;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.submit_post_date_survey(UUID, BOOLEAN, TEXT, TEXT) IS 'PRD §7 post-date survey. Derives target_id server-side, applies a fixed +2/-25 trust delta (named constants, Migration 19) and an optional badge increment to the TARGET only. Rejects an already-cancelled study date.';

-- ---------------------------------------------------------------------------
-- cancel_study_date — identical to Migration 18's version except the
-- last-minute penalty now references a named constant instead of bare -10.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_study_date(p_study_date_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_last_minute_cancel_delta CONSTANT INTEGER := -10; -- PRD §7: last-minute cancellation
  v_user1_id       UUID;
  v_user2_id       UUID;
  v_match_status   TEXT;
  v_scheduled_time TIMESTAMPTZ;
  v_sd_status      TEXT;
  v_updated_rows   INTEGER;
BEGIN
  SELECT m.user1_id, m.user2_id, m.status, sd.scheduled_time, sd.status
    INTO v_user1_id, v_user2_id, v_match_status, v_scheduled_time, v_sd_status
    FROM public.study_dates sd
    JOIN public.matches m ON m.id = sd.match_id
   WHERE sd.id = p_study_date_id
     AND auth.uid() IN (m.user1_id, m.user2_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study date not found or you are not a participant of its match'
      USING ERRCODE = 'ST007', HINT = 'NOT_PARTICIPANT';
  END IF;

  IF v_sd_status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'This study date has already been cancelled or completed'
      USING ERRCODE = 'ST008', HINT = 'ALREADY_TERMINAL';
  END IF;

  IF v_scheduled_time IS NOT NULL AND v_scheduled_time <= NOW() THEN
    RAISE EXCEPTION 'This study date has already happened - use the post-date survey instead'
      USING ERRCODE = 'ST009', HINT = 'ALREADY_PAST';
  END IF;

  UPDATE public.study_dates
     SET status = 'cancelled',
         cancelled_by = auth.uid(),
         cancelled_at = NOW()
   WHERE id = p_study_date_id
     AND status NOT IN ('cancelled', 'completed');

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows = 0 THEN
    RAISE EXCEPTION 'This study date was already cancelled or completed by someone else just now'
      USING ERRCODE = 'ST008', HINT = 'ALREADY_TERMINAL';
  END IF;

  -- Named constant: 2 hours. A future PRD change to this threshold is a
  -- one-line edit here, nowhere else. Only applies while the match is still
  -- active — see Migration 18's header for why.
  IF v_match_status = 'active'
     AND v_scheduled_time IS NOT NULL
     AND v_scheduled_time - NOW() < INTERVAL '2 hours' THEN
    UPDATE public.users
       SET trust_score = GREATEST(trust_score + c_last_minute_cancel_delta, 0)
     WHERE id = auth.uid();
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_study_date(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_study_date(UUID) TO authenticated;

COMMENT ON FUNCTION public.cancel_study_date(UUID) IS 'PRD §7 -10 last-minute-cancellation tier (named constant, Migration 19). cancelled_by is always auth.uid(), never a parameter. Applies the penalty to the CALLER only if cancelled within 2h of scheduled_time and the match is still active.';

-- ---------------------------------------------------------------------------
-- discoverable_users — identical to Migration 11's version except a comment
-- naming the shadowban threshold directly above where it's used. Views have
-- no DECLARE block, so this is the closest equivalent to a named constant
-- without introducing a lookup table for a single value (see migration
-- header for why that would be over-engineering here).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.discoverable_users
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
-- c_shadowban_trust_threshold = 60 (PRD §8: a user with trust_score below
-- this is hidden from Discovery's matching pool, not banned). Named here via
-- comment rather than a real declared constant — see this migration's header
-- for why views can't do the latter.
WHERE trust_score >= 60
  AND active_match_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swipes.swiper_id = auth.uid()
      AND swipes.target_id = users.id
  );

COMMENT ON VIEW public.discoverable_users IS 'Shadowban + Lock System + swipe-history filtered Discovery read surface. trust_score>=60 (PRD §8, named via comment — Migration 19), active_match_id IS NULL, and excludes anyone the querying user has already swiped on. Deliberately not security_invoker. Excludes email/verification_code.';
