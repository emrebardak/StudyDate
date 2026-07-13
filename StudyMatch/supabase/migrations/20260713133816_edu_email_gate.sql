-- Migration 2 — .edu / .edu.tr registration gate (PRD §3: exclusive academic access)
--
-- Rejects any signup whose email domain does not end in `.edu` or `.edu.tr`, enforced
-- at the earliest point: a BEFORE INSERT trigger on auth.users. A non-academic account
-- is never allowed to exist, even transiently.
--
-- NOTE on mechanism: newer Supabase also offers a "before user created" Auth Hook that
-- returns a cleaner client-facing error. We use a DB trigger here because it is simplest,
-- version-stable (verified against GoTrue v2.192.0), and self-contained in a migration.
-- Caveat: a raised exception surfaces to the client as a generic 500 from GoTrue rather
-- than a friendly validation message — acceptable for local Phase 1; revisit for prod UX.

CREATE OR REPLACE FUNCTION public.enforce_edu_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- ~* = case-insensitive regex. Pattern anchors `.edu` (optionally `.edu.tr`) to the
  -- very end of the address, so `x@school.edu` / `x@school.edu.tr` pass but
  -- `x@gmail.com` and `x@school.edu.evil.com` are rejected.
  IF NEW.email !~* '\.edu(\.tr)?$' THEN
    RAISE EXCEPTION 'Registration is restricted to .edu or .edu.tr university emails (got: %)', NEW.email
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_edu_email() IS 'PRD §3 academic-email gate: rejects non-.edu/.edu.tr signups before the auth.users row is written.';

CREATE TRIGGER edu_email_check
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_edu_email();
