-- Record the trainer who creates a work plan so submission status can be
-- reported per trainer rather than only per department.
ALTER TABLE public.work_plans
  ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX work_plans_created_by_idx ON public.work_plans(created_by);

-- Management needs visibility of every status to follow up on non-submission.
DROP POLICY "Work plans select policy" ON public.work_plans;
DROP POLICY IF EXISTS "Work plans select policy" ON public.work_plans;
CREATE POLICY "Work plans select policy" ON public.work_plans FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('reporting_officer', 'management') OR
    (public.get_user_role(auth.uid()) = 'department_user' AND department_id = public.get_user_department(auth.uid()))
  );
