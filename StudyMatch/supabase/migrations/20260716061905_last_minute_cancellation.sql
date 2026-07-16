-- Migration 18 — the -10 last-minute-cancellation trust tier (Option 1 of 3
-- proposed designs; see docs/development.md for the comparison and why this
-- one was chosen over a trigger-driven UPDATE or a survey-only extension)
--
-- PRD §7 lists 3 trust-score tiers; Phase 5 (Session 14) only implemented +2
-- and -25, because the post-date survey's binary "did it happen?" question
-- has no attribution mechanism for WHO cancelled or WHEN. This migration adds
-- that mechanism as its own explicit action, mirroring
-- submit_post_date_survey's architecture: one locked-down SECURITY DEFINER
-- RPC is the only path, no client-suppliable identity or delta.

-- ---------------------------------------------------------------------------
-- Schema: who cancelled, and when
-- ---------------------------------------------------------------------------
ALTER TABLE public.study_dates
  ADD COLUMN cancelled_by UUID REFERENCES public.users (id),
  ADD COLUMN cancelled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.study_dates.cancelled_by IS 'Set only by cancel_study_date() (SECURITY DEFINER) or service_role/postgres — see study_dates_protect_cancellation_before trigger. Never client-writable directly.';
COMMENT ON COLUMN public.study_dates.cancelled_at IS 'Set only by cancel_study_date() or service_role/postgres, alongside cancelled_by.';

-- ---------------------------------------------------------------------------
-- Guard trigger: block direct client writes to the cancellation columns/
-- transition, forcing everything through cancel_study_date() below.
--
-- Deliberately SECURITY INVOKER (the default — no SECURITY DEFINER clause),
-- NOT SECURITY DEFINER, for the exact reason proven empirically in Session 6
-- for protect_privileged_user_columns() on public.users: a SECURITY DEFINER
-- guard would make current_user read the function OWNER (postgres) for the
-- entire call, including when fired by a plain authenticated client's PATCH
-- — making the check a permanent no-op. Kept SECURITY INVOKER:
--   * A plain client UPDATE (role='authenticated'): current_user IS that
--     role at trigger-fire time -> rejected.
--   * cancel_study_date()'s own internal UPDATE: that function IS SECURITY
--     DEFINER (owned by postgres), so by the time ITS UPDATE fires this
--     (invoker) trigger, current_user is already 'postgres' -> allowed.
-- study_dates_update_participant RLS (Migration 6) already lets any
-- participant UPDATE any column on their match's study_dates rows — without
-- this trigger, a client could set status='cancelled' directly (skipping the
-- RPC's last-minute penalty entirely) or forge cancelled_by to blame the
-- other participant.
CREATE OR REPLACE FUNCTION public.protect_study_date_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (
       (NEW.status = 'cancelled' AND OLD.status <> 'cancelled')
       OR NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
       OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
     )
     AND current_user NOT IN ('service_role', 'postgres') THEN
    RAISE EXCEPTION 'Cancelling a study date must go through cancel_study_date(), not a direct write'
      USING ERRCODE = 'ST010', HINT = 'PROTECTED_CANCELLATION';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER study_dates_protect_cancellation_before
  BEFORE UPDATE ON public.study_dates
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_study_date_cancellation();

COMMENT ON FUNCTION public.protect_study_date_cancellation() IS 'Blocks direct client writes to status=cancelled / cancelled_by / cancelled_at. Deliberately SECURITY INVOKER (not DEFINER) — see comment above and Session 6''s dev log for why DEFINER would make this a no-op. Raises ERRCODE ST010 / HINT PROTECTED_CANCELLATION.';

-- ---------------------------------------------------------------------------
-- cancel_study_date — the only way a study date can be cancelled.
-- ---------------------------------------------------------------------------
-- Takes only the study date id. cancelled_by is ALWAYS auth.uid(), never a
-- parameter — structurally impossible to attribute a cancellation to the
-- other participant. The -10 penalty applies to the CALLER, not a peer-
-- reported target (unlike submit_post_date_survey) — safe specifically
-- because "did you cancel within the window" is an objective, timestamp-
-- driven fact the caller cannot fake in their own favor (they can't backdate
-- NOW()), unlike a self-report of subjective behavior.
CREATE OR REPLACE FUNCTION public.cancel_study_date(p_study_date_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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

  -- Re-check the terminal-status guard in the UPDATE's WHERE clause itself
  -- (not just the earlier SELECT) and inspect ROW_COUNT: closes a double-
  -- cancel race where two concurrent calls both pass the SELECT-based check
  -- before either commits. A single-row UPDATE with this WHERE guard is
  -- naturally serializing at the row level — no advisory lock needed, unlike
  -- the mutual-match-formation "double miss" race (Migration 12), which was
  -- a genuine two-DIFFERENT-row race this single-row case doesn't share.
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
  -- active — a match already ended by handleEndMatch or the timeout cron
  -- means the relationship already closed through a separate, more direct
  -- signal; piling on a redundant penalty for cancelling a now-moot leftover
  -- proposal would be double-counting.
  IF v_match_status = 'active'
     AND v_scheduled_time IS NOT NULL
     AND v_scheduled_time - NOW() < INTERVAL '2 hours' THEN
    UPDATE public.users
       SET trust_score = GREATEST(trust_score - 10, 0)
     WHERE id = auth.uid();
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_study_date(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_study_date(UUID) TO authenticated;

COMMENT ON FUNCTION public.cancel_study_date(UUID) IS 'PRD §7 -10 last-minute-cancellation tier. cancelled_by is always auth.uid(), never a parameter. Applies -10 to the CALLER only if cancelled within 2h of scheduled_time and the match is still active. Race-safe via a WHERE-guarded UPDATE + ROW_COUNT check.';

-- ---------------------------------------------------------------------------
-- Companion fix: submit_post_date_survey must not also apply its -25 to a
-- study date that was already cancelled through the RPC above. Without this,
-- someone could cancel within the window (-10), then get surveyed met=false
-- by the other participant for an ADDITIONAL -25 on the same date — a real
-- double-penalty vector, not hypothetical, since submit_post_date_survey
-- (Migration 14) only ever checked scheduled_time, never study_dates.status.
-- Identical to the original function otherwise — only the status check and
-- its error branch are new.
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

  -- New: a cancelled date already had its (possibly zero) penalty applied by
  -- cancel_study_date() — surveying it too would double-count.
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

COMMENT ON FUNCTION public.submit_post_date_survey(UUID, BOOLEAN, TEXT, TEXT) IS 'PRD §7 post-date survey. Derives target_id server-side, applies a fixed +2/-25 trust delta and an optional badge increment to the TARGET only. Rejects an already-cancelled study date (Migration 18) to avoid double-penalizing alongside cancel_study_date()''s -10.';
