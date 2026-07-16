-- Migration 15 — Phase 5: match-timeout cron sweep
--
-- PRD §6/§7: an active match with no messages in the last 12 hours expires,
-- releasing the Lock System's hold on both participants automatically.
--
-- Verified before writing this migration (see docs/development.md): pg_cron is
-- already preloaded in this stack's shared_preload_libraries (confirmed via a
-- throwaway `CREATE EXTENSION`/`DROP EXTENSION` round-trip, not assumed), so
-- CREATE EXTENSION below is expected to succeed cleanly.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Deliberately does NOT also `UPDATE users SET active_match_id = NULL`.
-- sync_active_match_id() (Migration 7) already generically releases the lock
-- for both participants on ANY matches.status transition away from 'active' —
-- confirmed by reading its source before writing this. Duplicating that logic
-- here would be redundant code that could drift out of sync with the trigger
-- over time; this function only needs to flip the status.
--
-- Single UPDATE statement is atomic by Postgres's normal statement-level
-- guarantee, satisfying the "entire operation is atomic, no partial unlocks"
-- requirement without an explicit transaction wrapper.
--
-- Note: matches.updated_at is currently only ever set at row-creation (nothing
-- bumps it later, e.g. on a reveal-flag toggle). That's fine here specifically
-- because the NOT EXISTS (recent message) clause is what actually protects an
-- active conversation from expiring, independent of whether updated_at itself
-- is fresh — not worth a bump-trigger in this phase since no combination of
-- the two conditions together produces a wrong result today.
CREATE OR REPLACE FUNCTION public.expire_stale_matches()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.matches
     SET status = 'expired'
   WHERE status = 'active'
     AND updated_at < NOW() - INTERVAL '12 hours'
     AND NOT EXISTS (
       SELECT 1 FROM public.messages
        WHERE messages.match_id = matches.id
          AND messages.created_at > NOW() - INTERVAL '12 hours'
     );
$$;

-- Sweeps ALL stale matches with no per-caller scoping — must never be directly
-- callable by authenticated/anon clients (unlike submit_post_date_survey,
-- which is intentionally client-facing). Postgres grants EXECUTE to PUBLIC by
-- default on new functions, so this REVOKE is load-bearing, not defensive
-- boilerplate.
REVOKE EXECUTE ON FUNCTION public.expire_stale_matches() FROM PUBLIC;

COMMENT ON FUNCTION public.expire_stale_matches() IS 'Phase 5 match-timeout sweep. Only flips matches.status to expired — the existing sync_active_match_id() trigger (Migration 7) handles releasing both participants'' active_match_id. Not callable by authenticated/anon (EXECUTE revoked from PUBLIC); invoked only via the pg_cron schedule below.';

SELECT cron.schedule('match-timeout-sweep', '*/15 * * * *', 'SELECT public.expire_stale_matches();');
