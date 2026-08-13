CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  age INTEGER CHECK (age >= 0 AND age <= 120),
  location TEXT,
  contact TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  feedback TEXT,
  testimonial TEXT,
  registered_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS update_beneficiaries_modtime ON public.beneficiaries;
CREATE TRIGGER update_beneficiaries_modtime
  BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beneficiaries select"
  ON public.beneficiaries FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('reporting_officer', 'management') OR
    department_id = public.get_user_department(auth.uid())
  );

CREATE POLICY "Beneficiaries write"
  ON public.beneficiaries FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  );
