CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('human', 'financial', 'material', 'equipment')),
  unit TEXT NOT NULL,
  quantity_planned NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_planned >= 0),
  quantity_used NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_used >= 0),
  unit_cost NUMERIC NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  period_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS update_resources_modtime ON public.resources;
CREATE TRIGGER update_resources_modtime
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources select"
  ON public.resources FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('reporting_officer', 'management') OR
    department_id = public.get_user_department(auth.uid())
  );

CREATE POLICY "Resources write"
  ON public.resources FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  );
