-- Migration 7 — Lock System enforcement at the DB layer (Phase 3)
--
-- The single-active-match invariant (PRD §5): a user with a non-null active_match_id
-- cannot acquire a second active match. The PRD's illustrative CHECK constraint
-- referencing another table isn't valid Postgres (per implemention.md's explicit
-- flag) — a trigger is the correct mechanism.
--
-- Both functions are SECURITY DEFINER: they must read/write BOTH participants'
-- public.users rows, but RLS only lets a caller touch their own row (users_update_own)
-- plus read a matched partner's row (users_select_matched) — neither is broad enough
-- for the initiator's INSERT to lock/unlock the OTHER participant. search_path is
-- pinned to prevent search-path hijacking of a SECURITY DEFINER function.

-- ---------------------------------------------------------------------------
-- 1) BEFORE INSERT/UPDATE — reject acquiring a second active match
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_single_active_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked_user UUID;
BEGIN
  -- Only matches becoming/staying 'active' can violate the invariant.
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  -- Re-saving an already-active match (e.g. flipping a reveal flag) isn't a new lock.
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO locked_user
  FROM public.users
  WHERE id IN (NEW.user1_id, NEW.user2_id)
    AND active_match_id IS NOT NULL
    AND active_match_id <> NEW.id
  LIMIT 1;

  IF locked_user IS NOT NULL THEN
    RAISE EXCEPTION 'Lock System: user % already has an active match', locked_user
      USING ERRCODE = 'ST001', HINT = 'ALREADY_LOCKED';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER matches_enforce_single_active_before
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_active_match();

COMMENT ON FUNCTION public.enforce_single_active_match() IS 'Lock System: rejects a match becoming active while either participant already has a different active match. Raises ERRCODE ST001 / HINT ALREADY_LOCKED for the frontend to detect.';

-- ---------------------------------------------------------------------------
-- 2) AFTER INSERT/UPDATE — keep users.active_match_id in sync with matches.status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_active_match_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN
      UPDATE public.users SET active_match_id = NEW.id
        WHERE id IN (NEW.user1_id, NEW.user2_id);
    END IF;
    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE'
  IF OLD.status = 'active' AND NEW.status <> 'active' THEN
    -- Match closed (completed/terminated/expired): release the lock for both
    -- participants. The "AND active_match_id = NEW.id" guard means this never
    -- clobbers a lock a participant has since acquired from a different match.
    UPDATE public.users SET active_match_id = NULL
      WHERE id IN (NEW.user1_id, NEW.user2_id) AND active_match_id = NEW.id;
  ELSIF OLD.status <> 'active' AND NEW.status = 'active' THEN
    UPDATE public.users SET active_match_id = NEW.id
      WHERE id IN (NEW.user1_id, NEW.user2_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER matches_sync_active_match_after
  AFTER INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_active_match_id();

COMMENT ON FUNCTION public.sync_active_match_id() IS 'Lock System: mirrors matches.status into both participants'' users.active_match_id — the single source of truth Discovery/Realtime read to know if a user is locked.';
