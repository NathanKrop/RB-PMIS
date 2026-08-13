-- Keep the dashboard's department filters and recent-update lookups fast as data grows.
ALTER TABLE public.evidence
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Backfill existing evidence. New uploads set this explicitly in the application.
UPDATE public.evidence AS evidence
SET department_id = activity.department_id
FROM public.activities AS activity
WHERE evidence.activity_id = activity.id
  AND evidence.department_id IS NULL;

UPDATE public.evidence AS evidence
SET department_id = uploader.department_id
FROM public.users AS uploader
WHERE evidence.uploaded_by = uploader.id
  AND evidence.department_id IS NULL;

CREATE INDEX IF NOT EXISTS activities_department_status_idx ON public.activities (department_id, status);
CREATE INDEX IF NOT EXISTS activities_department_updated_at_idx ON public.activities (department_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS reports_department_status_idx ON public.reports (department_id, status);
CREATE INDEX IF NOT EXISTS reports_department_updated_at_idx ON public.reports (department_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS evidence_department_updated_at_idx ON public.evidence (department_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS work_plans_department_updated_at_idx ON public.work_plans (department_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS indicators_activity_idx ON public.indicators (activity_id);
CREATE INDEX IF NOT EXISTS data_quality_checks_department_resolved_idx ON public.data_quality_checks (department_id, resolved);
CREATE INDEX IF NOT EXISTS reporting_deadlines_department_due_date_idx ON public.reporting_deadlines (department_id, due_date);

-- Collapses the dashboard's count and latest-update queries into one round trip.
-- SECURITY INVOKER ensures the caller's row-level-security policies still apply.
CREATE OR REPLACE FUNCTION public.get_department_dashboard_stats(p_department_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH latest_updates AS (
    SELECT max(updated_at) AS updated_at
    FROM (
      SELECT updated_at FROM public.activities WHERE department_id = p_department_id
      UNION ALL SELECT updated_at FROM public.reports WHERE department_id = p_department_id
      UNION ALL SELECT updated_at FROM public.evidence WHERE department_id = p_department_id
      UNION ALL SELECT updated_at FROM public.work_plans WHERE department_id = p_department_id
    ) AS updates
  )
  SELECT jsonb_build_object(
    'evidence_count', (SELECT count(*) FROM public.evidence WHERE department_id = p_department_id),
    'completed_activity_count', (SELECT count(*) FROM public.activities WHERE department_id = p_department_id AND status = 'completed'),
    'work_plan_count', (SELECT count(*) FROM public.work_plans WHERE department_id = p_department_id),
    'completed_activity_evidence_count', (
      SELECT count(*) FROM public.evidence AS evidence
      JOIN public.activities AS activity ON activity.id = evidence.activity_id
      WHERE activity.department_id = p_department_id AND activity.status = 'completed'
    ),
    'unresolved_data_quality_check_count', (
      SELECT count(*) FROM public.data_quality_checks
      WHERE department_id = p_department_id AND resolved = false
    ),
    'latest_updated_at', (SELECT updated_at FROM latest_updates)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_department_dashboard_stats(UUID) TO authenticated;
