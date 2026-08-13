-- Auto-notify on report status change via DB trigger
CREATE OR REPLACE FUNCTION public.notify_on_report_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a report is submitted, notify all reporting officers
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    INSERT INTO public.notifications (user_id, title, message, notification_type)
    SELECT id, 'New Report Submitted',
      'A report for "' || NEW.reporting_period_name || '" has been submitted for review.',
      'info'
    FROM public.users WHERE role = 'reporting_officer';
  END IF;

  -- When a report is approved or rejected, notify department trainers
  IF NEW.status IN ('approved', 'rejected') AND OLD.status != NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, notification_type)
    SELECT id,
      'Report ' || initcap(NEW.status),
      'Your report "' || NEW.reporting_period_name || '" has been ' || NEW.status || '.',
      CASE WHEN NEW.status = 'rejected' THEN 'escalation' ELSE 'info' END
    FROM public.users
    WHERE department_id = NEW.department_id AND role = 'department_user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_report_status_change ON public.reports;
CREATE TRIGGER on_report_status_change
  AFTER UPDATE OF status ON public.reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_on_report_status_change();

-- Auto-notify on evidence verification status change
CREATE OR REPLACE FUNCTION public.notify_on_evidence_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.verification_status != OLD.verification_status AND NEW.uploaded_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, notification_type)
    VALUES (
      NEW.uploaded_by,
      CASE WHEN NEW.verification_status = 'verified' THEN 'Evidence Verified' ELSE 'Evidence Needs Attention' END,
      'Your evidence "' || NEW.title || '" has been marked as ' || replace(NEW.verification_status, '_', ' ') || '.',
      CASE WHEN NEW.verification_status = 'verified' THEN 'info' ELSE 'escalation' END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_evidence_status_change ON public.evidence;
CREATE TRIGGER on_evidence_status_change
  AFTER UPDATE OF verification_status ON public.evidence
  FOR EACH ROW
  WHEN (OLD.verification_status IS DISTINCT FROM NEW.verification_status)
  EXECUTE FUNCTION public.notify_on_evidence_status_change();

-- Auto-notify on work plan status change
CREATE OR REPLACE FUNCTION public.notify_on_work_plan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status != NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, notification_type)
    SELECT id,
      'Work Plan ' || initcap(NEW.status),
      'Your work plan "' || NEW.period_name || '" has been ' || NEW.status || '.',
      CASE WHEN NEW.status = 'rejected' THEN 'escalation' ELSE 'info' END
    FROM public.users
    WHERE department_id = NEW.department_id AND role = 'department_user';
  END IF;

  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    INSERT INTO public.notifications (user_id, title, message, notification_type)
    SELECT id, 'Work Plan Submitted',
      'A work plan "' || NEW.period_name || '" has been submitted for review.',
      'info'
    FROM public.users WHERE role = 'reporting_officer';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_work_plan_status_change ON public.work_plans;
CREATE TRIGGER on_work_plan_status_change
  AFTER UPDATE OF status ON public.work_plans
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_on_work_plan_status_change();
