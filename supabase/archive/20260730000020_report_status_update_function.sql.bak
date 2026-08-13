-- Add stored procedure to update report status while passing rejection reason into session settings
-- so the report rejection reason trigger can validate the rejection comment.

CREATE OR REPLACE FUNCTION public.update_report_status(
  report_id UUID,
  new_status TEXT,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_status = 'rejected' THEN
    PERFORM set_config('app.rejection_reason', COALESCE(rejection_reason, ''), true);
  END IF;

  UPDATE public.reports
  SET status = new_status
  WHERE id = report_id;
END;
$$;
