-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('department_user', 'reporting_officer', 'management');

-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create profiles (users) table linked to auth.users
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role public.user_role NOT NULL DEFAULT 'department_user',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(user_id UUID)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT department_id FROM public.users WHERE id = user_id;
$$;

-- Create strategic objectives table
CREATE TABLE public.strategic_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create outcomes table
CREATE TABLE public.outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategic_objective_id UUID NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create outcome indicators table
CREATE TABLE public.outcome_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outcome_id UUID NOT NULL REFERENCES public.outcomes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL,
    baseline NUMERIC NOT NULL DEFAULT 0,
    target NUMERIC NOT NULL DEFAULT 0,
    current_value NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create outputs table
CREATE TABLE public.outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outcome_id UUID NOT NULL REFERENCES public.outcomes(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create work plans table
CREATE TABLE public.work_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'annual')),
    period_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create activities table
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    output_id UUID NOT NULL REFERENCES public.outputs(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    work_plan_id UUID REFERENCES public.work_plans(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'delayed', 'cancelled')) DEFAULT 'planned',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    responsible_person TEXT,
    required_resources TEXT,
    anticipated_risks TEXT,
    mitigation_measures TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indicators table
CREATE TABLE public.indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL,
    baseline NUMERIC NOT NULL DEFAULT 0,
    target NUMERIC NOT NULL DEFAULT 0,
    current_value NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create evidence table
CREATE TABLE public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'requires_clarification', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    reporting_period TEXT NOT NULL CHECK (reporting_period IN ('weekly', 'monthly', 'quarterly', 'annual')),
    reporting_period_name TEXT NOT NULL,
    outcome_progress TEXT,
    key_results TEXT,
    challenges TEXT,
    adaptive_actions TEXT,
    lessons_learned TEXT,
    next_period_priorities TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'reviewed', 'verified', 'approved', 'rejected')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Join Tables for Evidence (Many-to-Many relationships)
CREATE TABLE public.evidence_strategic_objectives (
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    strategic_objective_id UUID REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
    PRIMARY KEY (evidence_id, strategic_objective_id)
);

CREATE TABLE public.evidence_outcomes (
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    outcome_id UUID REFERENCES public.outcomes(id) ON DELETE CASCADE,
    PRIMARY KEY (evidence_id, outcome_id)
);

CREATE TABLE public.evidence_outputs (
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    output_id UUID REFERENCES public.outputs(id) ON DELETE CASCADE,
    PRIMARY KEY (evidence_id, output_id)
);

CREATE TABLE public.evidence_activities (
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    PRIMARY KEY (evidence_id, activity_id)
);

CREATE TABLE public.evidence_indicators (
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES public.indicators(id) ON DELETE CASCADE,
    PRIMARY KEY (evidence_id, indicator_id)
);

CREATE TABLE public.evidence_reports (
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    PRIMARY KEY (evidence_id, report_id)
);

-- Create evidence verifications log table
CREATE TABLE public.evidence_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('verified', 'requires_clarification', 'pending_evidence', 'rejected')),
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'escalation', 'info')) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profile Sync Trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'department_user'::public.user_role)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically update updated_at columns
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Register update triggers
DROP TRIGGER IF EXISTS update_departments_modtime ON public.departments;
CREATE TRIGGER update_departments_modtime BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_users_modtime ON public.users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_strategic_objectives_modtime ON public.strategic_objectives;
CREATE TRIGGER update_strategic_objectives_modtime BEFORE UPDATE ON public.strategic_objectives FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_outcomes_modtime ON public.outcomes;
CREATE TRIGGER update_outcomes_modtime BEFORE UPDATE ON public.outcomes FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_outcome_indicators_modtime ON public.outcome_indicators;
CREATE TRIGGER update_outcome_indicators_modtime BEFORE UPDATE ON public.outcome_indicators FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_outputs_modtime ON public.outputs;
CREATE TRIGGER update_outputs_modtime BEFORE UPDATE ON public.outputs FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_work_plans_modtime ON public.work_plans;
CREATE TRIGGER update_work_plans_modtime BEFORE UPDATE ON public.work_plans FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_activities_modtime ON public.activities;
CREATE TRIGGER update_activities_modtime BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_indicators_modtime ON public.indicators;
CREATE TRIGGER update_indicators_modtime BEFORE UPDATE ON public.indicators FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_evidence_modtime ON public.evidence;
CREATE TRIGGER update_evidence_modtime BEFORE UPDATE ON public.evidence FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_reports_modtime ON public.reports;
CREATE TRIGGER update_reports_modtime BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Enable RLS on all public tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. DEPARTMENTS POLICIES
CREATE POLICY "Departments are viewable by all authenticated users"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Departments are manageable by reporting officers only"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');

-- 2. USERS (PROFILES) POLICIES
CREATE POLICY "Profiles are viewable by all authenticated users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles can be updated by owner or reporting officers"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'reporting_officer');

-- 3. STRATEGIC RESULTS FRAMEWORK (Objectives, Outcomes, Indicators, Outputs)
-- Select rules: viewable by all authenticated users
DROP POLICY IF EXISTS "Strategic objectives select" ON public.strategic_objectives;
CREATE POLICY "Strategic objectives select" ON public.strategic_objectives FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Outcomes select" ON public.outcomes;
CREATE POLICY "Outcomes select" ON public.outcomes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Outcome indicators select" ON public.outcome_indicators;
CREATE POLICY "Outcome indicators select" ON public.outcome_indicators FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Outputs select" ON public.outputs;
CREATE POLICY "Outputs select" ON public.outputs FOR SELECT TO authenticated USING (true);

-- Edit rules: writeable by reporting officers only
DROP POLICY IF EXISTS "Strategic objectives write" ON public.strategic_objectives;
CREATE POLICY "Strategic objectives write" ON public.strategic_objectives FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer') WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');
DROP POLICY IF EXISTS "Outcomes write" ON public.outcomes;
CREATE POLICY "Outcomes write" ON public.outcomes FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer') WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');
DROP POLICY IF EXISTS "Outcome indicators write" ON public.outcome_indicators;
CREATE POLICY "Outcome indicators write" ON public.outcome_indicators FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer') WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');
DROP POLICY IF EXISTS "Outputs write" ON public.outputs;
CREATE POLICY "Outputs write" ON public.outputs FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer') WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');

-- 4. WORK PLANS
DROP POLICY IF EXISTS "Work plans select policy" ON public.work_plans;
CREATE POLICY "Work plans select policy" ON public.work_plans FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid())) OR
    (public.get_user_role(auth.uid()) = 'management' AND status = 'approved')
  );

DROP POLICY IF EXISTS "Work plans write policy" ON public.work_plans;
CREATE POLICY "Work plans write policy" ON public.work_plans FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  );

-- 5. ACTIVITIES
DROP POLICY IF EXISTS "Activities select policy" ON public.activities;
CREATE POLICY "Activities select policy" ON public.activities FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid())) OR
    (public.get_user_role(auth.uid()) = 'management' AND EXISTS (
      SELECT 1 FROM public.work_plans wp WHERE wp.id = work_plan_id AND wp.status = 'approved'
    ))
  );

DROP POLICY IF EXISTS "Activities write policy" ON public.activities;
CREATE POLICY "Activities write policy" ON public.activities FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  );

-- 6. INDICATORS (linked to activities)
DROP POLICY IF EXISTS "Indicators select policy" ON public.indicators;
CREATE POLICY "Indicators select policy" ON public.indicators FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND EXISTS (
       SELECT 1 FROM public.activities act WHERE act.id = activity_id AND act.department_id = public.get_user_department(auth.uid())
    )) OR
    (public.get_user_role(auth.uid()) = 'management' AND EXISTS (
       SELECT 1 FROM public.activities act
       JOIN public.work_plans wp ON wp.id = act.work_plan_id
       WHERE act.id = activity_id AND wp.status = 'approved'
    ))
  );

DROP POLICY IF EXISTS "Indicators write policy" ON public.indicators;
CREATE POLICY "Indicators write policy" ON public.indicators FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND EXISTS (
       SELECT 1 FROM public.activities act WHERE act.id = activity_id AND act.department_id = public.get_user_department(auth.uid())
    ))
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND EXISTS (
       SELECT 1 FROM public.activities act WHERE act.id = activity_id AND act.department_id = public.get_user_department(auth.uid())
    ))
  );

-- 7. EVIDENCE & JOIN TABLES
DROP POLICY IF EXISTS "Evidence select policy" ON public.evidence;
CREATE POLICY "Evidence select policy" ON public.evidence FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND uploaded_by IN (
       SELECT id FROM public.users WHERE department_id = public.get_user_department(auth.uid())
    )) OR
    (public.get_user_role(auth.uid()) = 'management' AND verification_status = 'verified')
  );

DROP POLICY IF EXISTS "Evidence insert policy" ON public.evidence;
CREATE POLICY "Evidence insert policy" ON public.evidence FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Evidence update/delete policy" ON public.evidence;
CREATE POLICY "Evidence update/delete policy" ON public.evidence FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND uploaded_by = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND uploaded_by = auth.uid())
  );

-- Evidence Links select rules
DROP POLICY IF EXISTS "Evidence strategic objective link select" ON public.evidence_strategic_objectives;
CREATE POLICY "Evidence strategic objective link select" ON public.evidence_strategic_objectives FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Evidence outcome link select" ON public.evidence_outcomes;
CREATE POLICY "Evidence outcome link select" ON public.evidence_outcomes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Evidence output link select" ON public.evidence_outputs;
CREATE POLICY "Evidence output link select" ON public.evidence_outputs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Evidence activity link select" ON public.evidence_activities;
CREATE POLICY "Evidence activity link select" ON public.evidence_activities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Evidence indicator link select" ON public.evidence_indicators;
CREATE POLICY "Evidence indicator link select" ON public.evidence_indicators FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Evidence report link select" ON public.evidence_reports;
CREATE POLICY "Evidence report link select" ON public.evidence_reports FOR SELECT TO authenticated USING (true);

-- Evidence Links write rules
DROP POLICY IF EXISTS "Evidence strategic objective link write" ON public.evidence_strategic_objectives;
CREATE POLICY "Evidence strategic objective link write" ON public.evidence_strategic_objectives FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Evidence outcome link write" ON public.evidence_outcomes;
CREATE POLICY "Evidence outcome link write" ON public.evidence_outcomes FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Evidence output link write" ON public.evidence_outputs;
CREATE POLICY "Evidence output link write" ON public.evidence_outputs FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Evidence activity link write" ON public.evidence_activities;
CREATE POLICY "Evidence activity link write" ON public.evidence_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Evidence indicator link write" ON public.evidence_indicators;
CREATE POLICY "Evidence indicator link write" ON public.evidence_indicators FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Evidence report link write" ON public.evidence_reports;
CREATE POLICY "Evidence report link write" ON public.evidence_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. REPORTS
DROP POLICY IF EXISTS "Reports select policy" ON public.reports;
CREATE POLICY "Reports select policy" ON public.reports FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid())) OR
    (public.get_user_role(auth.uid()) = 'management' AND status = 'approved')
  );

DROP POLICY IF EXISTS "Reports write policy" ON public.reports;
CREATE POLICY "Reports write policy" ON public.reports FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  );

-- 9. EVIDENCE VERIFICATIONS
DROP POLICY IF EXISTS "Evidence verifications select policy" ON public.evidence_verifications;
CREATE POLICY "Evidence verifications select policy" ON public.evidence_verifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Evidence verifications insert policy" ON public.evidence_verifications;
CREATE POLICY "Evidence verifications insert policy" ON public.evidence_verifications FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' AND reviewer_id = auth.uid()
  );

-- 10. NOTIFICATIONS
DROP POLICY IF EXISTS "Notifications select policy" ON public.notifications;
CREATE POLICY "Notifications select policy" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Notifications update policy" ON public.notifications;
CREATE POLICY "Notifications update policy" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
