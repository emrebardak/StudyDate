-- Migration 20 — real (offline-mode) email verification codes
--
-- Supersedes an earlier same-day draft of this file (kept the same filename/
-- timestamp since it was never committed — no shipped history to preserve).
-- That draft: numbered itself "Migration 19" (a collision with
-- trust_score_named_constants.sql, which is the real Migration 19 — this one
-- is 20), used bare literals (`lpad(floor(random()*1000000)::text,6,'0')`,
-- duplicated in two functions) instead of named constants, invented an
-- `EV0xx` error-code prefix instead of this project's established `ST0xx`
-- convention, had no code-expiry concept at all, named the resend RPC
-- `resend_verification_code()` returning the new code as TEXT, and — the real
-- gap — never extended `protect_privileged_user_columns()` to the new
-- columns, meaning a client could `PATCH /rest/v1/users {email_verified:
-- true}` directly and self-verify without ever knowing the real code. This
-- version fixes all of that.
--
-- Replaces the Phase 1 mock verification_code ('000000' hardcoded default,
-- never checked anywhere) with a real random-code flow: signup generates a
-- genuine random 6-digit code with an expiry, and two SECURITY DEFINER RPCs
-- (verify_email_code, regenerate_verification_code) are the only way to check
-- or refresh it. "Offline mode": no email is actually sent here — that's a
-- deliberately deferred "online mode" (see implemention.md / backend-dev.md's
-- Edge Functions section) that would call out to an email provider. Both RPCs
-- return void rather than the code itself — the offline-mode frontend
-- (RegisterEmailCodeScreen.tsx) re-reads verification_code via its existing
-- own-row SELECT (RLS-permitted, users_select_own) after calling either RPC,
-- the same read it already uses to display the initial signup code. That
-- keeps the RPC signatures identical for a future online mode, where the
-- code would never be readable by the client at all — only the SELECT-based
-- display path in the frontend would change, not these functions.
--
-- Naming: code length and expiry duration are named PL/pgSQL CONSTANTs, not
-- bare literals — expiry (15 minutes) was asked directly, not guessed.
-- Following Migration 19's established, documented pattern for this exact
-- class of value: PL/pgSQL CONSTANTs are function-local (no cross-function
-- import), so the expiry constant is intentionally re-declared at both call
-- sites (handle_new_user, regenerate_verification_code) rather than
-- introducing a shared-constant mechanism this schema doesn't otherwise have.
-- The actual CODE-GENERATION LOGIC (not just a constant value) is different —
-- that's real duplicable logic, not a bare literal, so it's extracted into
-- one shared helper, generate_verification_code(), used by both call sites
-- instead of being pasted twice.

-- ---------------------------------------------------------------------------
-- Schema: real expiry + verified flag; drop the mock hardcoded default
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN verification_code_expires_at TIMESTAMPTZ;

-- The '000000' default was Phase 1's mock placeholder (see create_users_table.sql).
-- Every new row now gets a real generated code + expiry from handle_new_user()
-- below, so a static default is no longer correct — remove it so no future
-- insert path can silently fall back to a well-known guessable code.
ALTER TABLE public.users ALTER COLUMN verification_code DROP DEFAULT;

COMMENT ON COLUMN public.users.verification_code IS 'Real random 6-digit code (generate_verification_code()), set at signup and by regenerate_verification_code(). Client-writable only via the verify_email_code/regenerate_verification_code RPCs — see users_protect_privileged_columns_before.';
COMMENT ON COLUMN public.users.verification_code_expires_at IS 'Expiry for verification_code (15 min from generation, named constant in handle_new_user()/regenerate_verification_code()). NULL or past = expired.';
COMMENT ON COLUMN public.users.email_verified IS 'Set true only by verify_email_code() on a correct, unexpired code. Protected from direct client writes (users_protect_privileged_columns_before). Gates AppNavigator.tsx session routing: an authenticated user with email_verified=false is routed to RegisterEmailCode, not MainTabs.';

-- ---------------------------------------------------------------------------
-- Shared code-generation helper — real logic (not just a constant value), so
-- it's extracted once rather than duplicated at both call sites below.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  c_verification_code_length CONSTANT INTEGER := 6;
BEGIN
  RETURN lpad(
    floor(random() * (10 ^ c_verification_code_length))::bigint::text,
    c_verification_code_length,
    '0'
  );
END;
$$;

-- No client ever needs to call this directly (it touches no data at all, but
-- least-privilege still applies). Only handle_new_user() and
-- regenerate_verification_code() call it, both SECURITY DEFINER functions
-- that run as the owner (postgres, a superuser) regardless of this REVOKE.
REVOKE EXECUTE ON FUNCTION public.generate_verification_code() FROM PUBLIC;

COMMENT ON FUNCTION public.generate_verification_code() IS 'Random zero-padded N-digit code (named constant: 6 digits). Shared by handle_new_user() and regenerate_verification_code() so the digit-count logic exists in exactly one place.';

-- ---------------------------------------------------------------------------
-- handle_new_user (Migration 3) — now also generates a real code + expiry at
-- signup instead of relying on the old '000000' column default.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_verification_code_ttl CONSTANT INTERVAL := '15 minutes'; -- user's explicit choice, asked not guessed
BEGIN
  INSERT INTO public.users (id, email, verification_code, verification_code_expires_at)
  VALUES (
    NEW.id,
    NEW.email,
    public.generate_verification_code(),
    NOW() + c_verification_code_ttl
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent: never fail signup if a row somehow exists
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Mirrors each new auth.users row into public.users with a real random verification_code + 15-minute expiry (Migration 20). Every account still gets a 1:1 profile row.';

-- ---------------------------------------------------------------------------
-- protect_privileged_user_columns (Migration 8) — extend the existing guard
-- to the three new verification columns. Without this, users_update_own
-- (Migration 4) would let a client PATCH email_verified=true directly —
-- self-verifying without ever knowing the real code, the same class of
-- self-unlock bug Session 6 closed for active_match_id/trust_score. Kept
-- SECURITY INVOKER for the identical reason documented in Migration 8's
-- header: SECURITY DEFINER would make current_user read 'postgres'
-- unconditionally and turn this check into a permanent no-op. The two RPCs
-- below are SECURITY DEFINER (owned by postgres), so their own internal
-- UPDATEs still pass this guard exactly like sync_active_match_id()'s always
-- have.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_privileged_user_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.active_match_id IS DISTINCT FROM OLD.active_match_id
      OR NEW.trust_score IS DISTINCT FROM OLD.trust_score
      OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
      OR NEW.verification_code IS DISTINCT FROM OLD.verification_code
      OR NEW.verification_code_expires_at IS DISTINCT FROM OLD.verification_code_expires_at)
     AND current_user NOT IN ('service_role', 'postgres') THEN
    RAISE EXCEPTION 'active_match_id, trust_score, email_verified, verification_code, and verification_code_expires_at can only be changed by trusted server-side logic, not a direct client write'
      USING ERRCODE = 'ST002', HINT = 'PROTECTED_COLUMN';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_privileged_user_columns() IS 'Blocks direct client writes to active_match_id/trust_score (Migration 8) and email_verified/verification_code/verification_code_expires_at (Migration 20). SECURITY INVOKER on purpose — see Migration 8 header. Raises ERRCODE ST002 / HINT PROTECTED_COLUMN.';

-- ---------------------------------------------------------------------------
-- verify_email_code — the only way email_verified can become true. Operates
-- only on the CALLER's own row (auth.uid()), never a client-supplied user id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_email_code(p_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_verified BOOLEAN;
  v_stored_code    TEXT;
  v_expires_at     TIMESTAMPTZ;
BEGIN
  SELECT email_verified, verification_code, verification_code_expires_at
    INTO v_email_verified, v_stored_code, v_expires_at
    FROM public.users
   WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile row for the current user'
      USING ERRCODE = 'ST012', HINT = 'NOT_FOUND';
  END IF;

  IF v_email_verified THEN
    RAISE EXCEPTION 'Email is already verified'
      USING ERRCODE = 'ST013', HINT = 'ALREADY_VERIFIED';
  END IF;

  IF v_expires_at IS NULL OR v_expires_at < NOW() THEN
    RAISE EXCEPTION 'Verification code has expired - request a new one'
      USING ERRCODE = 'ST014', HINT = 'CODE_EXPIRED';
  END IF;

  IF v_stored_code IS DISTINCT FROM btrim(p_code) THEN
    RAISE EXCEPTION 'Incorrect verification code'
      USING ERRCODE = 'ST015', HINT = 'INVALID_CODE';
  END IF;

  UPDATE public.users
     SET email_verified = true
   WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_email_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_email_code(TEXT) TO authenticated;

COMMENT ON FUNCTION public.verify_email_code(TEXT) IS 'Operates only on auth.uid()''s own row. Checks not-already-verified, not-expired, then exact code match, in that order, each with a distinct ERRCODE (ST012-ST015) so the client can tell the failure reasons apart. Sets email_verified=true on success.';

-- ---------------------------------------------------------------------------
-- regenerate_verification_code — resend/expiry path. Uses the same shared
-- generator as signup, so a regenerated code follows the identical format
-- rule. Returns void, not the code itself — see migration header for why.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.regenerate_verification_code()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_verification_code_ttl CONSTANT INTERVAL := '15 minutes'; -- same value as handle_new_user(), see migration header
  v_email_verified BOOLEAN;
BEGIN
  SELECT email_verified INTO v_email_verified
    FROM public.users
   WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile row for the current user'
      USING ERRCODE = 'ST012', HINT = 'NOT_FOUND';
  END IF;

  IF v_email_verified THEN
    RAISE EXCEPTION 'Email is already verified'
      USING ERRCODE = 'ST013', HINT = 'ALREADY_VERIFIED';
  END IF;

  UPDATE public.users
     SET verification_code = public.generate_verification_code(),
         verification_code_expires_at = NOW() + c_verification_code_ttl
   WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.regenerate_verification_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_verification_code() TO authenticated;

COMMENT ON FUNCTION public.regenerate_verification_code() IS 'Resend/expiry path: generates a fresh code (public.generate_verification_code()) + new 15-minute expiry on the caller''s own row. Rejects an already-verified account (ST013) same as verify_email_code. Returns void — caller re-reads verification_code via the existing own-row SELECT.';
