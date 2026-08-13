-- Invites: user invitation system
CREATE TABLE IF NOT EXISTS public.invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token         uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  role          public.user_role NOT NULL DEFAULT 'department_user',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  redeemed      boolean NOT NULL DEFAULT false,
  redeemed_at   timestamptz,
  revoked       boolean NOT NULL DEFAULT false,
  expires_at    timestamptz,
  created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_invites_modtime
  BEFORE UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Only service role (used by admin API) can read/write invites.
-- Authenticated users have no direct access — all invite operations
-- go through the hardened /api/admin/invites route which uses the
-- service role key server-side.
CREATE POLICY "invites_service_role_only" ON public.invites
  FOR ALL
  USING (false)
  WITH CHECK (false);
