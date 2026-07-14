-- Migration 8 — Lock System hardening (Phase 3 bug-hunt follow-up)
--
-- Closes two gaps found in the Session 5 trigger pair
-- (20260714073226_lock_system_enforcement.sql):
--
--   GAP 1: users_update_own (Migration 4) lets an authenticated client PATCH ANY
--   column on their own public.users row, including active_match_id and trust_score.
--   Nothing added since then blocked this — the Session 5 triggers only fire on
--   writes to public.matches. A client could self-unlock (or forge a trust_score)
--   with a direct PATCH to /rest/v1/users, defeating the Lock System entirely.
--
--   GAP 2: enforce_single_active_match() only SELECTs (no row lock) before the
--   separate AFTER trigger's UPDATE. Under READ COMMITTED, two concurrent INSERTs
--   sharing a user can both pass the check before either commits, producing two
--   simultaneously-active matches for the same user.

-- ---------------------------------------------------------------------------
-- GAP 1 fix — reject client writes to the two privileged columns
-- ---------------------------------------------------------------------------
--
-- IMPORTANT deviation from a naive "just make it SECURITY DEFINER" approach:
-- this guard function is deliberately SECURITY INVOKER (the default — no
-- SECURITY DEFINER clause), NOT SECURITY DEFINER. Empirically verified against
-- this stack (see docs/development.md Session 6): SECURITY DEFINER changes
-- current_user to the function's OWNER for the duration of the call — including
-- inside a trigger fired by someone else's statement. If this guard were
-- SECURITY DEFINER (owned by postgres), current_user would read 'postgres'
-- unconditionally on every invocation, for a plain authenticated client's PATCH
-- exactly the same as for our own trusted sync_active_match_id() write — making
-- the check permanently pass and the guard a no-op. Verified with a scratch
-- table + RAISE NOTICE trigger: a SECURITY DEFINER trigger reported
-- current_user='postgres' even when fired by an 'authenticated'-role UPDATE.
--
-- Kept SECURITY INVOKER, the check works correctly in both directions:
--   * A plain client UPDATE (role='authenticated'/'anon'): current_user is
--     literally that role at trigger-fire time -> rejected.
--   * sync_active_match_id()'s internal UPDATE: that function IS SECURITY
--     DEFINER (owned by postgres, per Migration 7), so by the time ITS UPDATE
--     statement fires this (invoker) trigger, current_user is already
--     'postgres' (switched by the outer SECURITY DEFINER call) -> allowed.
--   * A direct service_role REST call (service key): PostgREST's SET ROLE
--     service_role means current_user='service_role' at fire time -> allowed.
CREATE OR REPLACE FUNCTION public.protect_privileged_user_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.active_match_id IS DISTINCT FROM OLD.active_match_id
      OR NEW.trust_score IS DISTINCT FROM OLD.trust_score)
     AND current_user NOT IN ('service_role', 'postgres') THEN
    RAISE EXCEPTION 'active_match_id and trust_score can only be changed by trusted server-side logic, not a direct client write'
      USING ERRCODE = 'ST002', HINT = 'PROTECTED_COLUMN';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER users_protect_privileged_columns_before
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_user_columns();

COMMENT ON FUNCTION public.protect_privileged_user_columns() IS 'Lock System hardening: blocks direct client writes to active_match_id/trust_score. Deliberately SECURITY INVOKER (not DEFINER) — see migration header for why DEFINER would make this check a no-op. Raises ERRCODE ST002 / HINT PROTECTED_COLUMN.';

-- ---------------------------------------------------------------------------
-- GAP 2 fix — row-lock both participants before checking for an existing lock
-- ---------------------------------------------------------------------------
-- Adds a `FOR UPDATE` on both participants' users rows, ORDER BY id, before the
-- existing check. This serializes concurrent match-creation attempts that share
-- a user: the second transaction blocks on the row lock until the first commits
-- (and its AFTER trigger's UPDATE has landed) or rolls back, so it re-checks
-- against the POST-commit state instead of a stale pre-commit read. ORDER BY id
-- gives every transaction the same lock-acquisition order for any pair of users,
-- which is what prevents a circular-wait deadlock between two transactions that
-- each try to lock two overlapping users in opposite order.
--
-- No deadlock against sync_active_match_id()'s own UPDATE on the same rows: it
-- runs in the SAME transaction (AFTER trigger of the same statement), and a
-- transaction can always re-lock/update rows it already holds a lock on within
-- itself — verified explicitly below (docs/development.md Session 6) with a
-- single normal insert completing without hanging, plus a two-session
-- concurrency test.
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

  -- Gap 2 fix: lock both participants' rows, in a fixed (id-ascending) order,
  -- BEFORE reading their lock state. A concurrent transaction touching either
  -- user now blocks here instead of racing this one to the check below.
  PERFORM 1 FROM public.users
  WHERE id IN (NEW.user1_id, NEW.user2_id)
  ORDER BY id
  FOR UPDATE;

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

COMMENT ON FUNCTION public.enforce_single_active_match() IS 'Lock System: rejects a match becoming active while either participant already has a different active match. Row-locks both participants (ORDER BY id, Gap 2 fix) before checking, closing a TOCTOU race between concurrent match-creation attempts. Raises ERRCODE ST001 / HINT ALREADY_LOCKED.';
