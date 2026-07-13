-- Migration 4 — Row Level Security on public.users
--
-- Default-deny: enabling RLS with no policy blocks all access. We then grant exactly the
-- Phase 1 access needed — a user may read and update ONLY their own row (auth.uid() = id).
--
-- Broader read access (seeing OTHER users' academic cards in Discovery) is intentionally
-- deferred to Phase 4/5, where the `discoverable_users` view (trust_score >= 60) becomes
-- the single, shadowban-aware read surface. Adding a blanket "read everyone" policy now
-- would have to be walked back then, so we keep it own-row only.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Table-level DML grants. RLS only filters WHICH rows a role sees; the role must first
-- have base SELECT/UPDATE privilege on the table or every query is "permission denied"
-- before RLS is even evaluated. This CLI's default privileges grant authenticated only
-- TRUNCATE/REFERENCES/TRIGGER (not DML), so we grant the DML this phase needs explicitly.
--   * authenticated: SELECT + UPDATE (RLS narrows both to the caller's own row)
--   * anon: nothing — no anonymous access to profiles
--   * INSERT/DELETE: none for clients. Rows are created by the SECURITY DEFINER trigger
--     handle_new_user() and removed by cascade from auth.users, never via the API.
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- A user can read their own profile row.
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- A user can update their own profile row (name, university, goal, photos, etc.).
-- Note: this does NOT stop them writing to trust_score/active_match_id from the client;
-- those are protected later by moving their mutations behind SECURITY DEFINER functions
-- (Phase 3 Lock System trigger, Phase 5 trust-score function) rather than column RLS.
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No INSERT policy on purpose: rows are created only by the SECURITY DEFINER trigger
-- handle_new_user() (Migration 3), never directly by clients.
-- No DELETE policy: account deletion cascades from auth.users, not via client DELETE.

COMMENT ON POLICY "users_select_own" ON public.users IS 'Phase 1: own-row read only. Cross-user reads come later via the discoverable_users view.';
COMMENT ON POLICY "users_update_own" ON public.users IS 'Own-row updates only. Privileged columns (trust_score, active_match_id) are mutated via SECURITY DEFINER functions in later phases.';
