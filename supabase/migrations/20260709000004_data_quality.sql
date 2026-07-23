CREATE TABLE public.data_quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('completeness', 'anomaly', 'duplicate')),
  entity TEXT NOT NULL,
  issue TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.data_quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Data quality checks select"
  ON public.data_quality_checks FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('reporting_officer', 'management') OR
    department_id = public.get_user_department(auth.uid())
  );

CREATE POLICY "Data quality checks write"
  ON public.data_quality_checks FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');
