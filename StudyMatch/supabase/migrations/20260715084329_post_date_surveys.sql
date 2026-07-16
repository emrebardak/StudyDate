-- Migration 14 — Phase 5: post-date survey table + submit_post_date_survey RPC
--
-- PRD §7 ("Post-Date: Trust Score & Gamification"): after a real-life study date,
-- either participant can rate the OTHER one via a 3-question survey. Two scope
-- decisions, made explicit here rather than guessed at silently (see the plan
-- this migration implements, docs/development.md for the full session write-up):
--
--   1. The PRD's trust-score table has 3 tiers (+2 success / -10 last-minute
--      cancel / -25 no-show), but the survey's Q1 is a binary "Did the meeting
--      happen?" Yes/No. There is no attribution mechanism anywhere in the schema
--      for WHO cancelled or WHEN relative to the scheduled time, and no
--      "last-minute" threshold is defined anywhere. This migration implements
--      only the two tiers the survey can actually express (+2 / -25). The -10
--      tier is a flagged, deferred gap, not a hidden bug.
--
--   2. study_dates.status never reaches 'accepted' in the current app (no
--      "accept" flow exists in StudyDatePlannerScreen.tsx — confirmed by reading
--      it). Gating survey eligibility on status='accepted' would make this
--      entire feature silently unreachable. The RPC below instead gates on
--      status <> 'cancelled' AND scheduled_time in the past. Building the
--      missing accept flow is a separate, out-of-scope feature.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE public.post_date_surveys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_date_id  UUID NOT NULL REFERENCES public.study_dates (id) ON DELETE CASCADE,
  reviewer_id    UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  target_id      UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,

  -- Q1: did the meeting happen. Q2/Q3 only make sense when it did.
  met            BOOLEAN NOT NULL,
  environment    TEXT CHECK (environment IN ('Highly Focused', 'Casual', 'Off-topic')),
  badge          TEXT CHECK (badge IN ('Punctual', 'Silent & Focused', 'Great Explainer', 'Good Break Buddy')),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT post_date_surveys_no_self_review CHECK (reviewer_id <> target_id),
  CONSTRAINT post_date_surveys_environment_required_if_met CHECK (met = FALSE OR environment IS NOT NULL),

  -- One survey per (study date, reviewer) — a resubmission attempt is a 23505,
  -- not a silent double-apply of the trust delta.
  CONSTRAINT post_date_surveys_unique_reviewer UNIQUE (study_date_id, reviewer_id)
);

CREATE INDEX idx_post_date_surveys_target_id ON public.post_date_surveys (target_id);

COMMENT ON TABLE public.post_date_surveys IS 'PRD §7 post-date survey submissions. environment is captured but NOT scored (the PRD lists point values only for the meeting-outcome question). badge is optional even when met=true.';
COMMENT ON COLUMN public.post_date_surveys.environment IS 'Not scored. Not wired into PRD §8''s separate "multiple off-topic reports -> shadowban" moderation system either — that''s a distinct, unbuilt reporting feature (no reports table exists).';

-- ---------------------------------------------------------------------------
-- RLS — read your own submissions only; NO insert grant at all, every write
-- goes through submit_post_date_survey() below. Same "revoke direct client
-- writes, force through a function" shape as mutual_match_formation.sql
-- (Migration 12) revoking authenticated's INSERT on matches.
-- ---------------------------------------------------------------------------
ALTER TABLE public.post_date_surveys ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.post_date_surveys TO authenticated;

-- Deliberately reviewer-scoped, not target-scoped: a user can see what THEY
-- submitted, never what was submitted about them ("who rated me and how" stays
-- hidden, matching PRD §7's "Hidden Trust Score" framing).
CREATE POLICY "post_date_surveys_select_own"
  ON public.post_date_surveys
  FOR SELECT
  USING (reviewer_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies. authenticated has no base INSERT grant on
-- this table at all — writes only happen inside submit_post_date_survey(),
-- which is SECURITY DEFINER and therefore bypasses RLS/grants entirely for its
-- own INSERT.

-- ---------------------------------------------------------------------------
-- submit_post_date_survey — the only way a survey (and its trust-score/badge
-- side effects) can be recorded.
-- ---------------------------------------------------------------------------
-- Deliberately does NOT accept target_id or a raw trust-score delta as
-- parameters. target_id is derived server-side as "the other participant" of
-- the study date's match (never trust a client-supplied target — same
-- reasoning as form_match_on_mutual_swipe() deriving match participants
-- itself). The delta is computed from FIXED CONSTANTS only (+2 / -25) inside
-- this function, never accepted as a parameter — an RPC that took an arbitrary
-- signed integer delta plus an arbitrary target user_id (the literal shape of
-- docs/backend-dev.md's illustrative apply_trust_delta(user_id, delta) example)
-- would let any authenticated client forge anyone's trust_score. This is the
-- same class of gap Sessions 6/8/10 each found and closed elsewhere in this
-- schema — closed here from the start instead of built and fixed later.
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
  v_user1_id       UUID;
  v_user2_id       UUID;
  v_scheduled_time TIMESTAMPTZ;
  v_target         UUID;
  v_delta          INTEGER;
BEGIN
  SELECT m.user1_id, m.user2_id, sd.scheduled_time
    INTO v_user1_id, v_user2_id, v_scheduled_time
    FROM public.study_dates sd
    JOIN public.matches m ON m.id = sd.match_id
   WHERE sd.id = p_study_date_id
     AND auth.uid() IN (m.user1_id, m.user2_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study date not found or you are not a participant of its match'
      USING ERRCODE = 'ST005', HINT = 'NOT_PARTICIPANT';
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

  -- 23505 (unique_violation on post_date_surveys_unique_reviewer) propagates
  -- unmodified on a resubmission attempt — the frontend maps it to "you
  -- already rated this date" rather than this function swallowing it.
  INSERT INTO public.post_date_surveys (study_date_id, reviewer_id, target_id, met, environment, badge)
  VALUES (p_study_date_id, auth.uid(), v_target, p_met, p_environment, p_badge);

  v_delta := CASE WHEN p_met THEN 2 ELSE -25 END;

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

-- Postgres grants EXECUTE on new functions to PUBLIC by default (unlike table
-- DML, which this project has repeatedly found authenticated has NO default
-- privilege on) — verified empirically (not assumed) that this left `anon`
-- able to call this function too, despite no explicit GRANT to anon anywhere.
-- The internal auth.uid() check would likely reject an anon caller in practice
-- (NULL never matches a real participant), but that's not a substitute for
-- least-privilege: REVOKE FROM PUBLIC first, matching how anon is locked out
-- of every other table/function in this schema explicitly rather than
-- incidentally.
REVOKE EXECUTE ON FUNCTION public.submit_post_date_survey(UUID, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_post_date_survey(UUID, BOOLEAN, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.submit_post_date_survey(UUID, BOOLEAN, TEXT, TEXT) IS 'PRD §7 post-date survey. Derives target_id server-side (never client-supplied), applies a fixed +2/-25 trust delta and an optional badge increment to the TARGET only. The -10 last-minute-cancel tier is out of scope (see migration header).';
