-- Auto-create data quality issues for common validation failures
-- Also adds fields for ownership, corrective action, due date, and escalation

ALTER TABLE public.data_quality_checks
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS corrective_action TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN NOT NULL DEFAULT false;

-- Trigger: auto-create DQ issue when activity is completed without evidence
CREATE OR REPLACE FUNCTION public.auto_check_activity_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    -- Check if activity has at least one evidence item linked via evidence_activities
    IF NOT EXISTS (
      SELECT 1 FROM public.evidence_activities ea
      JOIN public.evidence e ON e.id = ea.evidence_id
      WHERE ea.activity_id = NEW.id AND e.verification_status = 'verified'
    ) THEN
      INSERT INTO public.data_quality_checks (
        checked_by, department_id, check_type, entity, issue, severity
      ) VALUES (
        auth.uid(),
        NEW.department_id,
        'completeness',
        'activity:' || NEW.id,
        'Activity "' || COALESCE(NEW.description, '(unnamed)') || '" was marked completed but has no verified evidence.',
        'high'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_check_activity_evidence ON public.activities;
CREATE TRIGGER auto_check_activity_evidence
  AFTER UPDATE OF status ON public.activities
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.auto_check_activity_evidence();

-- Trigger: auto-create DQ issue when report submitted without required narratives
CREATE OR REPLACE FUNCTION public.auto_check_report_completeness()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  missing_fields TEXT[];
BEGIN
  missing_fields := ARRAY[]::TEXT[];

  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    IF COALESCE(NEW.outcome_progress, '') = '' THEN
      missing_fields := array_append(missing_fields, 'Outcome Progress');
    END IF;
    IF COALESCE(NEW.key_results, '') = '' THEN
      missing_fields := array_append(missing_fields, 'Key Results');
    END IF;
    IF COALESCE(NEW.challenges, '') = '' THEN
      missing_fields := array_append(missing_fields, 'Challenges');
    END IF;
    IF COALESCE(NEW.adaptive_actions, '') = '' THEN
      missing_fields := array_append(missing_fields, 'Adaptive Actions');
    END IF;
    IF COALESCE(NEW.lessons_learned, '') = '' THEN
      missing_fields := array_append(missing_fields, 'Lessons Learned');
    END IF;
    IF COALESCE(NEW.next_period_priorities, '') = '' THEN
      missing_fields := array_append(missing_fields, 'Next Period Priorities');
    END IF;

    IF array_length(missing_fields, 1) > 0 THEN
      INSERT INTO public.data_quality_checks (
        checked_by, department_id, check_type, entity, issue, severity
      ) VALUES (
        auth.uid(),
        NEW.department_id,
        'completeness',
        'report:' || NEW.id,
        'Report "' || COALESCE(NEW.reporting_period_name, '(unnamed)') || '" was submitted with missing fields: ' || array_to_string(missing_fields, ', ') || '.',
        'medium'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_check_report_completeness ON public.reports;
CREATE TRIGGER auto_check_report_completeness
  AFTER UPDATE OF status ON public.reports
  FOR EACH ROW
  WHEN (NEW.status = 'submitted' AND OLD.status = 'draft')
  EXECUTE FUNCTION public.auto_check_report_completeness();

-- Trigger: auto-create DQ issue for duplicate work plans (same dept + period)
CREATE OR REPLACE FUNCTION public.auto_check_duplicate_work_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.work_plans wp
    WHERE wp.department_id = NEW.department_id
      AND wp.period_type = NEW.period_type
      AND wp.period_name = NEW.period_name
      AND wp.id <> NEW.id
      AND wp.status NOT IN ('rejected', 'draft')
  ) THEN
    INSERT INTO public.data_quality_checks (
      checked_by, department_id, check_type, entity, issue, severity
    ) VALUES (
      NEW.department_id,
      NEW.department_id,
      'duplicate',
      'work_plan:' || NEW.id,
      'Duplicate work plan detected: Department already has a ' || NEW.period_type || ' plan for "' || NEW.period_name || '".',
      'medium'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_check_duplicate_work_plan ON public.work_plans;
CREATE TRIGGER auto_check_duplicate_work_plan
  AFTER INSERT OR UPDATE OF period_type, period_name ON public.work_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_check_duplicate_work_plan();

-- Trigger: update resolved_at timestamp when a DQ check is resolved
CREATE OR REPLACE FUNCTION public.update_dq_resolved_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.resolved = true AND OLD.resolved = false THEN
    NEW.resolved_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_dq_resolved_at ON public.data_quality_checks;
CREATE TRIGGER update_dq_resolved_at
  BEFORE UPDATE OF resolved ON public.data_quality_checks
  FOR EACH ROW
  WHEN (NEW.resolved = true AND OLD.resolved = false)
  EXECUTE FUNCTION public.update_dq_resolved_at();
