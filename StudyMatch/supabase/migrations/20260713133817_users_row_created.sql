-- Migration 3 — auto-provision a public.users profile row on signup
--
-- Standard Supabase pattern: whenever Supabase Auth writes a new auth.users row (after
-- the .edu gate in Migration 2 has passed), mirror it into public.users so every account
-- always has a matching profile row. The app then fills in name/university/etc. via UPDATE.
--
-- SECURITY DEFINER so the trigger can INSERT into public.users regardless of the caller's
-- RLS context (signups happen in the auth context, not as the end user).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;  -- idempotent: never fail signup if a row somehow exists
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Mirrors each new auth.users row into public.users so every account has a 1:1 profile row.';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
