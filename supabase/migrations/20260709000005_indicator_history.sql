CREATE TABLE public.indicator_value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES public.outcome_indicators(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL CHECK (value >= 0),
  recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX indicator_value_history_indicator_recorded_at_idx
  ON public.indicator_value_history (indicator_id, recorded_at);

ALTER TABLE public.indicator_value_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Indicator history select" ON public.indicator_value_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Indicator history write" ON public.indicator_value_history
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer' AND recorded_by = auth.uid());
