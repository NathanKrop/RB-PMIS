ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS work_plan_id UUID REFERENCES public.work_plans(id) ON DELETE SET NULL;
