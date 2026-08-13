-- Enforce valid status transitions for work plans, reports, evidence, and activities
-- Prevent self-approval/self-verification

-- ── Work Plan Status Transitions ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_work_plan_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if unchanged
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Valid transitions: draft → submitted → approved | rejected
  IF NOT (
    (OLD.status = 'draft' AND NEW.status = 'submitted') OR
    (OLD.status = 'submitted' AND NEW.status IN ('approved', 'rejected'))
  ) THEN
    RAISE EXCEPTION 'Invalid work plan status transition: % → %', OLD.status, NEW.status;
  END IF;

  -- Prevent department users from approving their own work plans
  IF NEW.status IN ('approved', 'rejected') THEN
    IF public.get_user_role(auth.uid()) = 'department_user' THEN
      RAISE EXCEPTION 'Department users cannot approve or reject work plans';
    END IF;
    -- Check the work plan belongs to the user's department if they are a department user
    IF EXISTS (
      SELECT 1 FROM public.work_plans wp
      JOIN public.users u ON u.id = auth.uid()
      WHERE wp.id = NEW.id AND wp.department_id = u.department_id
        AND u.role = 'department_user'
    ) THEN
      RAISE EXCEPTION 'Users cannot approve or reject their own department work plans';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_work_plan_status_transition ON public.work_plans;
DROP TRIGGER IF EXISTS check_work_plan_status_transition ON public.work_plans;
CREATE TRIGGER check_work_plan_status_transition
  BEFORE UPDATE OF status ON public.work_plans
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.check_work_plan_status_transition();

-- ── Report Status Transitions ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_report_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Valid transitions: draft → submitted → reviewed → verified → approved | rejected
  -- Rejected reports can go back to draft for editing
  IF NOT (
    (OLD.status = 'draft' AND NEW.status = 'submitted') OR
    (OLD.status = 'submitted' AND NEW.status IN ('reviewed', 'rejected')) OR
    (OLD.status = 'reviewed' AND NEW.status IN ('verified', 'rejected')) OR
    (OLD.status = 'verified' AND NEW.status IN ('approved', 'rejected')) OR
    (OLD.status = 'rejected' AND NEW.status = 'draft')
  ) THEN
    RAISE EXCEPTION 'Invalid report status transition: % → %', OLD.status, NEW.status;
  END IF;

  -- Prevent department users from reviewing/verifying/approving their own reports
  IF NEW.status IN ('reviewed', 'verified', 'approved') THEN
    IF EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.users u ON u.id = auth.uid()
      WHERE r.id = NEW.id AND r.department_id = u.department_id
    ) THEN
      RAISE EXCEPTION 'Users cannot review, verify, or approve their own department reports';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_report_status_transition ON public.reports;
DROP TRIGGER IF EXISTS check_report_status_transition ON public.reports;
CREATE TRIGGER check_report_status_transition
  BEFORE UPDATE OF status ON public.reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.check_report_status_transition();

-- ── Evidence Status Transitions ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_evidence_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.verification_status IS NOT DISTINCT FROM NEW.verification_status THEN
    RETURN NEW;
  END IF;

  -- Valid transitions: pending → verified | requires_clarification | rejected
  IF NOT (
    OLD.verification_status = 'pending' AND
    NEW.verification_status IN ('verified', 'requires_clarification', 'rejected')
  ) THEN
    RAISE EXCEPTION 'Invalid evidence status transition: % → %', OLD.verification_status, NEW.verification_status;
  END IF;

  -- Prevent users from verifying their own evidence
  IF NEW.verification_status = 'verified' AND OLD.uploaded_by = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot verify their own evidence';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_evidence_status_transition ON public.evidence;
DROP TRIGGER IF EXISTS check_evidence_status_transition ON public.evidence;
CREATE TRIGGER check_evidence_status_transition
  BEFORE UPDATE OF verification_status ON public.evidence
  FOR EACH ROW
  WHEN (OLD.verification_status IS DISTINCT FROM NEW.verification_status)
  EXECUTE FUNCTION public.check_evidence_status_transition();

-- ── Activity Status Transitions ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_activity_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Valid transitions: planned → in_progress → completed | delayed | cancelled
  IF NOT (
    (OLD.status = 'planned' AND NEW.status IN ('in_progress', 'cancelled')) OR
    (OLD.status = 'in_progress' AND NEW.status IN ('completed', 'delayed', 'cancelled')) OR
    (OLD.status = 'delayed' AND NEW.status IN ('in_progress', 'completed', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Invalid activity status transition: % → %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_activity_status_transition ON public.activities;
DROP TRIGGER IF EXISTS check_activity_status_transition ON public.activities;
CREATE TRIGGER check_activity_status_transition
  BEFORE UPDATE OF status ON public.activities
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.check_activity_status_transition();

-- ── Rejection reasons requirement ────────────────────────────────────────────

-- Require a rejection reason comment when work plans or reports are rejected
CREATE OR REPLACE FUNCTION public.require_rejection_reason()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rejection_comment TEXT;
BEGIN
  IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if a rejection reason was provided as a session variable or setting
    BEGIN
      rejection_comment := current_setting('app.rejection_reason', true);
    EXCEPTION WHEN OTHERS THEN
      rejection_comment := NULL;
    END;

    IF rejection_comment IS NULL OR length(trim(rejection_comment)) = 0 THEN
      RAISE EXCEPTION 'A rejection reason is required. Please provide a comment explaining why this was rejected.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS require_work_plan_rejection_reason ON public.work_plans;
DROP TRIGGER IF EXISTS require_work_plan_rejection_reason ON public.work_plans;
CREATE TRIGGER require_work_plan_rejection_reason
  BEFORE UPDATE OF status ON public.work_plans
  FOR EACH ROW
  WHEN (NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.require_rejection_reason();

DROP TRIGGER IF EXISTS require_report_rejection_reason ON public.reports;
DROP TRIGGER IF EXISTS require_report_rejection_reason ON public.reports;
CREATE TRIGGER require_report_rejection_reason
  BEFORE UPDATE OF status ON public.reports
  FOR EACH ROW
  WHEN (NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.require_rejection_reason();

