CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'operational',
  likelihood TEXT NOT NULL CHECK (likelihood IN ('low', 'medium', 'high')) DEFAULT 'medium',
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('open', 'mitigating', 'escalated', 'closed')) DEFAULT 'open',
  owner TEXT,
  mitigation_plan TEXT,
  mitigation_effectiveness INTEGER NOT NULL DEFAULT 0 CHECK (mitigation_effectiveness BETWEEN 0 AND 100),
  due_date DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS update_risks_modtime ON public.risks;
CREATE TRIGGER update_risks_modtime BEFORE UPDATE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Risks select" ON public.risks;
CREATE POLICY "Risks select" ON public.risks FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) IN ('reporting_officer', 'management') OR department_id = public.get_user_department(auth.uid()));
DROP POLICY IF EXISTS "Risks write" ON public.risks;
CREATE POLICY "Risks write" ON public.risks FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'reporting_officer') WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');
