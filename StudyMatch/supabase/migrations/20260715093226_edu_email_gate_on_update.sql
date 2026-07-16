-- Migration 17 — close the .edu/.edu.tr gate's post-signup bypass
--
-- enforce_edu_email() (Migration 2, edu_email_gate.sql) was only wired to
-- BEFORE INSERT ON auth.users, so it gated signup but nothing stopped a
-- later supabase.auth.updateUser({ email: 'anyone@gmail.com' }) — a
-- permanent bypass of PRD §3's "academic-only access" requirement after the
-- account already exists. Reuses the exact same function (no duplicated
-- validation logic to drift out of sync), just wired to a second trigger.
CREATE TRIGGER edu_email_check_on_update
  BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.enforce_edu_email();
