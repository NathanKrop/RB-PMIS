-- Monthly Reflection Workflow
-- Reflection prompts, review of results/challenges, decisions/adaptive actions,
-- assigned owners, links to reports, activities, and lessons learned

CREATE TABLE public.monthly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  period_name TEXT NOT NULL, -- e.g., "January 2026"
  reflection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Structured reflection prompts
  what_worked_well TEXT,
  what_did_not_work TEXT,
  unexpected_outcomes TEXT,
  key_challenges TEXT,
  -- Results & adaptive actions
  results_achieved TEXT,
  adaptive_actions_taken TEXT,
  decisions_made TEXT,
  -- Links
  linked_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  linked_activity_ids TEXT, -- comma-separated UUID list
  linked_risk_ids TEXT,
  -- Generated lessons learned
  lessons_learned TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'reviewed', 'archived')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient queries
CREATE INDEX monthly_reflections_dept_period_idx ON public.monthly_reflections (department_id, period_name DESC);

-- Triggers
DROP TRIGGER IF EXISTS update_monthly_reflections_modtime ON public.monthly_reflections;
CREATE TRIGGER update_monthly_reflections_modtime
  BEFORE UPDATE ON public.monthly_reflections
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- RLS
ALTER TABLE public.monthly_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Monthly reflections select" ON public.monthly_reflections;
CREATE POLICY "Monthly reflections select" ON public.monthly_reflections FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('reporting_officer', 'management') OR
    department_id = public.get_user_department(auth.uid())
  );

DROP POLICY IF EXISTS "Monthly reflections write" ON public.monthly_reflections;
CREATE POLICY "Monthly reflections write" ON public.monthly_reflections FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');

-- Auto-create knowledge item when a reflection is submitted
CREATE OR REPLACE FUNCTION public.auto_create_knowledge_from_reflection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  knowledge_content TEXT;
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    knowledge_content := '## Reflection Period: ' || NEW.period_name || E'\n\n'
      || '### What Worked Well' || E'\n' || COALESCE(NEW.what_worked_well, 'Not specified') || E'\n\n'
      || '### Challenges' || E'\n' || COALESCE(NEW.key_challenges, 'Not specified') || E'\n\n'
      || '### Adaptive Actions' || E'\n' || COALESCE(NEW.adaptive_actions_taken, 'Not specified') || E'\n\n'
      || '### Lessons Learned' || E'\n' || COALESCE(NEW.lessons_learned, 'Not specified');

    INSERT INTO public.knowledge_items (
      title, category, content, tags, period_reference, department_id, created_by
    ) VALUES (
      'Monthly Reflection: ' || NEW.period_name || ' - ' || NEW.department_id,
      'lessons_learned',
      knowledge_content,
      'reflection,monthly,' || NEW.period_name,
      NEW.period_name,
      NEW.department_id,
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_create_knowledge_from_reflection ON public.monthly_reflections;
DROP TRIGGER IF EXISTS auto_create_knowledge_from_reflection ON public.monthly_reflections;
CREATE TRIGGER auto_create_knowledge_from_reflection
  AFTER UPDATE OF status ON public.monthly_reflections
  FOR EACH ROW
  WHEN (NEW.status = 'submitted' AND OLD.status = 'draft')
  EXECUTE FUNCTION public.auto_create_knowledge_from_reflection();
