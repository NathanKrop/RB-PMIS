CREATE TYPE public.knowledge_category AS ENUM (
  'lessons_learned',
  'best_practice',
  'case_study',
  'success_story'
);

CREATE TABLE public.knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.knowledge_category NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  period_reference TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS update_knowledge_items_modtime ON public.knowledge_items;
CREATE TRIGGER update_knowledge_items_modtime
  BEFORE UPDATE ON public.knowledge_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Knowledge items select"
  ON public.knowledge_items FOR SELECT
  TO authenticated
  USING (true);

-- Only reporting officers can write
CREATE POLICY "Knowledge items write"
  ON public.knowledge_items FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');
