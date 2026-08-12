-- Budget submission and revision requests

CREATE TABLE IF NOT EXISTS public.budget_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id     uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  budget_line_id    uuid REFERENCES public.budget_lines(id) ON DELETE SET NULL,
  request_type      text NOT NULL CHECK (request_type IN ('submission', 'revision')),
  title             text NOT NULL,
  category          text NOT NULL DEFAULT 'other',
  fiscal_year       text NOT NULL,
  amount_requested  numeric(15,2) NOT NULL,
  justification     text NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  review_notes      text,
  reviewed_at       timestamptz,
  created_by        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_budget_requests_modtime
  BEFORE UPDATE ON public.budget_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

ALTER TABLE public.budget_requests ENABLE ROW LEVEL SECURITY;

-- Finance: full access
CREATE POLICY "finance_budget_requests_all" ON public.budget_requests
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid())::text = 'finance')
  WITH CHECK (public.get_user_role(auth.uid())::text = 'finance');

-- Management: read + review (update)
CREATE POLICY "management_budget_requests_read" ON public.budget_requests
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'management');

CREATE POLICY "management_budget_requests_update" ON public.budget_requests
  FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'management')
  WITH CHECK (public.get_user_role(auth.uid()) = 'management');

-- Reporting officer: read-only
CREATE POLICY "officer_budget_requests_read" ON public.budget_requests
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer');
