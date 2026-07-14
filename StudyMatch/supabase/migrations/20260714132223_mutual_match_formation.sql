-- Migration 12 — real double opt-in match formation (PRD §4)
--
-- Prior behavior: DiscoveryScreen.tsx inserted directly into public.matches on a
-- single right swipe, immediately locking both users via the Session 3 Lock System
-- trigger pair. That was never real "double opt-in" — a single one-sided swipe
-- formed a match with no reciprocity check at all (flagged as a known gap in
-- Sessions 6-8's dev log, never fixed until now).
--
-- This migration makes match formation happen exclusively as a side effect of a
-- MUTUAL right swipe, driven entirely by public.swipes (added in Migration 11):
--   1. A user swiping right INSERTs into swipes (already the case since Session 8's
--      recordSwipe — no schema change needed there).
--   2. A trigger on swipes checks for the reciprocal right-swipe. If found, it
--      creates the matches row itself.
--   3. Direct client INSERTs into public.matches are now REVOKED entirely — the
--      only way a match can be created is this trigger. Without this, a modified
--      client could still POST straight to /rest/v1/matches and bypass double
--      opt-in completely, exactly reproducing the original gap; enforcing it only
--      in DiscoveryScreen.tsx's normal UI path is not real enforcement.

-- ---------------------------------------------------------------------------
-- Defensive hygiene: no self-swipes. Never reachable through the UI (Discovery
-- excludes yourself from the candidate pool), but public.matches already has the
-- equivalent matches_distinct_users CHECK, so swipes gets the same treatment.
-- ---------------------------------------------------------------------------
ALTER TABLE public.swipes
  ADD CONSTRAINT swipes_no_self_swipe CHECK (swiper_id <> target_id);

-- ---------------------------------------------------------------------------
-- The mutual-match trigger
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER for the same reason as the Lock System triggers (Migration 7):
-- the resulting matches INSERT needs to succeed regardless of which of the two
-- users' swipe happened to complete the pair, which the plain
-- matches_insert_initiator-style "auth.uid() = user1_id" shape can't express (the
-- INSERT here is never done "as" either participant — it's a system-formed row).
-- SECURITY DEFINER functions run with the owner's (postgres, superuser)
-- privileges, bypassing both RLS and table GRANTs — which is also exactly why
-- REVOKing the authenticated role's INSERT grant on matches below doesn't affect
-- this trigger's ability to create the row.
--
-- pg_advisory_xact_lock, keyed on the unordered pair of user ids, closes a TOCTOU
-- race distinct from Migration 8's Gap 2: two people swiping right on each other
-- at nearly the same instant are two INSERTs on DIFFERENT swipes rows (A->B and
-- B->A), so there is no shared row for a SELECT ... FOR UPDATE to lock — the
-- reciprocal row a transaction is checking for may not exist yet purely because
-- the other transaction hasn't committed, not because it will never exist. Without
-- serializing on the pair, both transactions could run their "does the reciprocal
-- row exist?" check before either commits and both see nothing, so NEITHER creates
-- a match even though both users really did swipe right on each other. The
-- advisory lock forces the second transaction to wait for the first to fully
-- commit before it checks, so it reliably sees the first transaction's row.
--
-- The matches INSERT is wrapped in its own sub-transaction (BEGIN/EXCEPTION) so
-- that if match creation fails (most commonly ST001 — one of the two users
-- acquired an unrelated active match in the meantime, via the EXISTING Lock
-- System trigger pair, which still runs unmodified on this INSERT), the swipe
-- being recorded is NOT rolled back. Recording a user's swipe must always succeed
-- on its own merits; failing to also form a match is a separate, non-fatal
-- outcome. This does mean a failed match attempt is not retried later if the
-- blocking lock subsequently clears — flagged as a known limitation, not fixed
-- here (would need a periodic sweep or an on-unlock re-check, out of scope).
CREATE OR REPLACE FUNCTION public.form_match_on_mutual_swipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reciprocal_exists BOOLEAN;
BEGIN
  IF NEW.direction <> 'right' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(LEAST(NEW.swiper_id, NEW.target_id)::text),
    hashtext(GREATEST(NEW.swiper_id, NEW.target_id)::text)
  );

  SELECT EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swiper_id = NEW.target_id
      AND target_id = NEW.swiper_id
      AND direction = 'right'
  ) INTO reciprocal_exists;

  IF reciprocal_exists THEN
    BEGIN
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (LEAST(NEW.swiper_id, NEW.target_id), GREATEST(NEW.swiper_id, NEW.target_id));
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'form_match_on_mutual_swipe: match creation failed for % <-> % (%). Swipe still recorded.',
        NEW.swiper_id, NEW.target_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER swipes_form_match_after
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.form_match_on_mutual_swipe();

COMMENT ON FUNCTION public.form_match_on_mutual_swipe() IS 'Real double opt-in (PRD §4): forms a matches row only when both users have swiped right on each other. pg_advisory_xact_lock closes the two-concurrent-inserts race; match-creation failure (e.g. ST001) never rolls back the swipe itself. SECURITY DEFINER — see migration header.';

-- ---------------------------------------------------------------------------
-- Close the direct-insert bypass: matches can no longer be created by a plain
-- client REST call, only by the trigger above.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "matches_insert_initiator" ON public.matches;
REVOKE INSERT ON public.matches FROM authenticated;

COMMENT ON TABLE public.matches IS 'One row per formed match. Rows are created exclusively by form_match_on_mutual_swipe() (Migration 12) on a mutual right-swipe — authenticated has no direct INSERT grant. status=active is the Lock System state that locks Discovery for both users; single-active-match invariant enforced by enforce_single_active_match() (Migration 7/8).';
