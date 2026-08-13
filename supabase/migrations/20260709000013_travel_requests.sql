-- Travel Requests

CREATE TABLE IF NOT EXISTS public.travel_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id       uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  traveller_name      text NOT NULL,
  traveller_user_id   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  destination         text NOT NULL,
  purpose             text NOT NULL,
  departure_date      date NOT NULL,
  return_date         date NOT NULL,
  transport_mode      text NOT NULL CHECK (transport_mode IN ('air', 'road', 'rail', 'sea', 'other')),
  estimated_cost      numeric(15,2) NOT NULL DEFAULT 0,
  per_diem_days       integer NOT NULL DEFAULT 0 CHECK (per_diem_days >= 0),
  per_diem_rate       numeric(15,2) NOT NULL DEFAULT 0,
  total_per_diem      numeric(15,2) GENERATED ALWAYS AS (per_diem_days * per_diem_rate) STORED,
  advance_requested   numeric(15,2) NOT NULL DEFAULT 0,
  budget_line_id      uuid REFERENCES public.budget_lines(id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','submitted','approved','rejected','cancelled')),
  submitted_at        timestamptz,
  reviewed_by         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  review_notes        text,
  created_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT return_after_departure CHECK (return_date >= departure_date)
);

CREATE TRIGGER update_travel_requests_modtime
  BEFORE UPDATE ON public.travel_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;

-- Finance: full access
CREATE POLICY "travel_finance_all" ON public.travel_requests
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'finance')
  WITH CHECK (public.get_user_role(auth.uid()) = 'finance');

-- Management: read + update (approve/reject)
CREATE POLICY "travel_management_read" ON public.travel_requests
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'management');

CREATE POLICY "travel_management_update" ON public.travel_requests
  FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'management')
  WITH CHECK (public.get_user_role(auth.uid()) = 'management');

-- Reporting officer: read-only
CREATE POLICY "travel_officer_read" ON public.travel_requests
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer');

-- Department users: read own department's requests
CREATE POLICY "travel_dept_read" ON public.travel_requests
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'department_user'
    AND department_id = public.get_user_department(auth.uid())
  );
