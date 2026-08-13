-- Invites table for controlled signup / invite flow

CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email text,
  role public.user_role NOT NULL DEFAULT 'department_user',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  redeemed boolean NOT NULL DEFAULT false,
  redeemed_at timestamptz
);

CREATE INDEX IF NOT EXISTS invites_token_idx ON public.invites (token);

-- Keep invites under RLS; service-role key will bypass RLS for server operations.
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Admins and service processes may insert/select/update via service-role key. For convenience
-- allow authenticated users to see their own invite by token (optional). Use server endpoints
-- for redemption which should run with the service role key.
