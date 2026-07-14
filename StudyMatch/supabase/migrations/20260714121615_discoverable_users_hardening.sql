-- Migration 11 — discoverable_users hardening (bug-hunt follow-up on Session 7)
--
-- Closes two gaps found in the Session 7 shadowban view / Discovery wiring
-- (20260714080407_discoverable_users_view.sql):
--
--   GAP 1: the view only filtered `trust_score >= 60`. Excluding already-locked
--   candidates was done client-side in DiscoveryScreen.tsx's query string
--   (`.is('active_match_id', null)`), not enforced by the view itself — any
--   authenticated client could drop that param and read every discoverable
--   user's lock status regardless. The Lock System trigger still correctly
--   rejects an actual match attempt against a locked candidate, so this was a
--   read-side leak only, not an exploitable path to a bad match, but a rule
--   the whole feature is built around had no DB-level enforcement.
--
--   GAP 2: no persisted swipe/pass history. loadDiscovery() re-fetches the same
--   batch every refresh with nothing excluding candidates already decided on,
--   so Discovery loops the same faces forever once a user works through one
--   batch.

-- ---------------------------------------------------------------------------
-- GAP 2 (table first, so the view below can reference it) — swipe history
-- ---------------------------------------------------------------------------
CREATE TABLE public.swipes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id  UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  target_id  UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  direction  TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One decision per (swiper, target) pair — permanent, Tinder-style. This also
  -- doubles as the exact index the discoverable_users NOT EXISTS check below
  -- needs (swiper_id, target_id), so no separate index is added.
  CONSTRAINT swipes_unique_pair UNIQUE (swiper_id, target_id)
);

COMMENT ON TABLE public.swipes IS 'Permanent swipe/pass history. A decided candidate never reappears in discoverable_users for that swiper (see the view''s NOT EXISTS clause). Not consulted by the Lock System — this is UI-quality history, not a match-formation gate.';

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- Only INSERT + SELECT are granted — no UPDATE/DELETE, matching the "a swipe
-- decision is permanent" semantics the UI already implies (there's no "undo").
GRANT SELECT, INSERT ON public.swipes TO authenticated;

-- A user only ever needs to read THEIR OWN swipe history (to power the
-- discoverable_users exclusion for themselves) — never who swiped on them.
CREATE POLICY "swipes_select_own"
  ON public.swipes
  FOR SELECT
  USING (swiper_id = auth.uid());

-- Record a decision only as yourself.
CREATE POLICY "swipes_insert_own"
  ON public.swipes
  FOR INSERT
  WITH CHECK (swiper_id = auth.uid());

-- No UPDATE/DELETE policies: a swipe, once recorded, is permanent.

-- ---------------------------------------------------------------------------
-- GAP 1 + GAP 2 — recreate the view with both exclusions enforced server-side
-- ---------------------------------------------------------------------------
-- Same explicit column list and security_barrier as Migration 10 (still
-- excludes email/verification_code, still deliberately not security_invoker —
-- see that migration's header for the full reasoning, re-verified below rather
-- than assumed to still hold after this change).
--
-- auth.uid() inside a plain (non-security_invoker) view re-evaluates per
-- QUERYING session, not once at view-creation time: it reads the
-- request.jwt.claims GUC of whoever is actually running the query right now,
-- which is a live, per-connection session variable — not table data or
-- something SECURITY DEFINER/INVOKER-style role-switching touches. This is the
-- same category of fact Session 6 proved for auth.role() surviving a SECURITY
-- DEFINER boundary; verified again here empirically for a non-security_invoker
-- VIEW specifically (two different callers, two different exclusion sets) —
-- see docs/development.md Session 8, not just asserted from documentation.
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
WHERE trust_score >= 60
  AND active_match_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swipes.swiper_id = auth.uid()
      AND swipes.target_id = users.id
  );

COMMENT ON VIEW public.discoverable_users IS 'Shadowban + Lock System + swipe-history filtered Discovery read surface. trust_score>=60 (PRD §8), active_match_id IS NULL (Gap 1: was client-filtered only), and excludes anyone the querying user has already swiped on (Gap 2, per-caller via auth.uid()). Deliberately not security_invoker. Excludes email/verification_code.';
