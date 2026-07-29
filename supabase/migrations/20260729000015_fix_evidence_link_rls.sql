-- Fix evidence link table RLS: restrict write access to users who can write to evidence
-- Previously allowed any authenticated user to create arbitrary links (USING(true) WITH CHECK(true))

-- Evidence Links write rules - restrict to evidence uploaders, reporting officers, and management
DROP POLICY IF EXISTS "Evidence strategic objective link write" ON public.evidence_strategic_objectives;
CREATE POLICY "Evidence strategic objective link write" ON public.evidence_strategic_objectives FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  );

DROP POLICY IF EXISTS "Evidence outcome link write" ON public.evidence_outcomes;
CREATE POLICY "Evidence outcome link write" ON public.evidence_outcomes FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  );

DROP POLICY IF EXISTS "Evidence output link write" ON public.evidence_outputs;
CREATE POLICY "Evidence output link write" ON public.evidence_outputs FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  );

DROP POLICY IF EXISTS "Evidence activity link write" ON public.evidence_activities;
CREATE POLICY "Evidence activity link write" ON public.evidence_activities FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  );

DROP POLICY IF EXISTS "Evidence indicator link write" ON public.evidence_indicators;
CREATE POLICY "Evidence indicator link write" ON public.evidence_indicators FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  );

DROP POLICY IF EXISTS "Evidence report link write" ON public.evidence_reports;
CREATE POLICY "Evidence report link write" ON public.evidence_reports FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'reporting_officer' OR
    EXISTS (SELECT 1 FROM public.evidence e WHERE e.id = evidence_id AND e.uploaded_by = auth.uid())
  );

