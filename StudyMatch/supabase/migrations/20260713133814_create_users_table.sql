-- Migration 1 — public.users profile table
--
-- Accounts themselves live in Supabase's built-in `auth.users` (email, password/OTP,
-- session tokens — managed by Supabase Auth). This table holds the app-specific
-- profile fields that `auth.users` has no room for, keyed 1:1 to the auth row.
--
-- Naming: snake_case (Postgres convention). The frontend interfaces in
-- StudyMatch/src/types/index.ts are camelCase — a mapping layer is required at the
-- data-access boundary (see docs/integration.md), NOT a 1:1 field-name copy.

CREATE TABLE public.users (
  -- 1:1 with auth.users. ON DELETE CASCADE so deleting the auth account removes the profile.
  id                UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email             TEXT UNIQUE NOT NULL,

  -- Static academic identity (PRD §3)
  name              TEXT,
  university        TEXT,
  department        TEXT,
  grade             INTEGER,
  year              TEXT CHECK (year IN ('Freshman', 'Sophomore', 'Junior', 'Senior')),

  -- Trust & gamification (PRD §7) — starts at 100, adjusted by post-date surveys later.
  trust_score       INTEGER NOT NULL DEFAULT 100,
  badges            JSONB   NOT NULL DEFAULT '{}'::jsonb,

  -- Dynamic "Today's Goal" status (PRD §3)
  current_goal_text TEXT,
  current_tags      TEXT[] NOT NULL DEFAULT '{}',

  -- Lock System (PRD §5): the single active match that locks Discovery for this user.
  -- FK is added in a later migration once public.matches exists (Phase 2), to avoid a
  -- forward reference here.
  active_match_id   UUID,

  -- Study "vibe & habits" (map to the enums in src/types/index.ts)
  audio_environment TEXT,
  study_pacing      TEXT,
  study_fuel        TEXT,

  -- Progressive-disclosure photos (blurred until mutual reveal) + misc profile
  photo_url         TEXT,
  photos            TEXT[] NOT NULL DEFAULT '{}',
  bio               TEXT,
  availability      TEXT[] NOT NULL DEFAULT '{}',
  city              TEXT,

  -- MOCK email verification for local Phase 1 testing only. Hardcoded default '000000'.
  -- This is a placeholder — real email confirmation (Supabase Auth magic link / OTP)
  -- replaces it in a later phase. Do NOT treat this as a real verification mechanism.
  verification_code TEXT NOT NULL DEFAULT '000000',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the Lock System lookup (find a user's active match quickly / null it on unlock).
CREATE INDEX idx_users_active_match_id ON public.users (active_match_id);

COMMENT ON TABLE  public.users IS 'App profile data, 1:1 with auth.users. CamelCase frontend maps to these snake_case columns at the data layer.';
COMMENT ON COLUMN public.users.verification_code IS 'MOCK local-testing code (default 000000). Placeholder for real Supabase Auth email confirmation — replace in a later phase.';
COMMENT ON COLUMN public.users.active_match_id IS 'Lock System: the single active match locking Discovery. FK to public.matches added in Phase 2.';
