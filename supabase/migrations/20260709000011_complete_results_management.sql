-- Completes the data contracts required by the RB-PMIS system guide.
ALTER TABLE public.strategic_objectives
  ADD COLUMN IF NOT EXISTS responsible_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reporting_frequency TEXT CHECK (reporting_frequency IN ('weekly', 'monthly', 'quarterly', 'annual'));

ALTER TABLE public.outcome_indicators
  ADD COLUMN IF NOT EXISTS responsible_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reporting_frequency TEXT CHECK (reporting_frequency IN ('weekly', 'monthly', 'quarterly', 'annual'));

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS intended_outcome TEXT,
  ADD COLUMN IF NOT EXISTS implementation_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS progress_update TEXT,
  ADD COLUMN IF NOT EXISTS actual_achievement TEXT,
  ADD COLUMN IF NOT EXISTS variance_analysis TEXT;

ALTER TABLE public.evidence
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT,
  ADD COLUMN IF NOT EXISTS reporting_period TEXT,
  ADD COLUMN IF NOT EXISTS captured_at DATE,
  ADD COLUMN IF NOT EXISTS version_group UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number > 0),
  ADD COLUMN IF NOT EXISTS parent_evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL;

ALTER TABLE public.knowledge_items
  ADD COLUMN IF NOT EXISTS source_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number > 0);

CREATE TABLE IF NOT EXISTS public.reporting_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  reporting_period TEXT NOT NULL CHECK (reporting_period IN ('weekly', 'monthly', 'quarterly', 'annual')),
  reporting_period_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  reminder_days INTEGER NOT NULL DEFAULT 3 CHECK (reminder_days >= 0),
  escalation_days INTEGER NOT NULL DEFAULT 1 CHECK (escalation_days >= 0),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (department_id, reporting_period, reporting_period_name)
);

ALTER TABLE public.reporting_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporting deadlines select" ON public.reporting_deadlines FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('reporting_officer', 'management') OR department_id = public.get_user_department(auth.uid()));
CREATE POLICY "Reporting deadlines write" ON public.reporting_deadlines FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');

CREATE INDEX IF NOT EXISTS evidence_search_idx ON public.evidence USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(caption, '') || ' ' || coalesce(keywords, '')));
CREATE INDEX IF NOT EXISTS reporting_deadlines_due_date_idx ON public.reporting_deadlines (due_date);

CREATE OR REPLACE FUNCTION public.process_reporting_deadlines()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_count INTEGER := 0;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, notification_type)
  SELECT u.id, 'Reporting deadline reminder', 'Your ' || d.reporting_period_name || ' report is due on ' || d.due_date::text || '.', 'reminder'
  FROM public.reporting_deadlines d
  JOIN public.users u ON u.department_id = d.department_id AND u.role = 'department_user'
  WHERE current_date = d.due_date - d.reminder_days
    AND NOT EXISTS (SELECT 1 FROM public.reports r WHERE r.department_id = d.department_id AND r.reporting_period = d.reporting_period AND r.reporting_period_name = d.reporting_period_name AND r.status <> 'draft')
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = u.id
        AND n.title = 'Reporting deadline reminder'
        AND n.message = 'Your ' || d.reporting_period_name || ' report is due on ' || d.due_date::text || '.'
        AND n.created_at::date = current_date
    );
  GET DIAGNOSTICS created_count = ROW_COUNT;

  INSERT INTO public.notifications (user_id, title, message, notification_type)
  SELECT u.id, 'Overdue report escalation', d.reporting_period_name || ' is overdue for a department.', 'escalation'
  FROM public.reporting_deadlines d
  JOIN public.users u ON u.role = 'reporting_officer'
  WHERE current_date = d.due_date + d.escalation_days
    AND NOT EXISTS (SELECT 1 FROM public.reports r WHERE r.department_id = d.department_id AND r.reporting_period = d.reporting_period AND r.reporting_period_name = d.reporting_period_name AND r.status IN ('submitted', 'reviewed', 'verified', 'approved'))
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = u.id
        AND n.title = 'Overdue report escalation'
        AND n.message = d.reporting_period_name || ' is overdue for a department.'
        AND n.created_at::date = current_date
    );
  RETURN created_count;
END;
$$;
