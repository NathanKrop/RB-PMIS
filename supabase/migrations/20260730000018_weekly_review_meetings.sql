-- Weekly Review Meeting Module
-- Schedule, agenda, attendance, discussion notes, decisions, follow-up actions

CREATE TABLE public.weekly_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  agenda TEXT NOT NULL,
  discussion_notes TEXT,
  decisions TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.weekly_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  UNIQUE (meeting_id, user_id)
);

CREATE TABLE public.meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.weekly_meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'completed', 'overdue')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient queries
CREATE INDEX weekly_meetings_dept_date_idx ON public.weekly_meetings (department_id, meeting_date DESC);
CREATE INDEX meeting_action_items_assigned_idx ON public.meeting_action_items (assigned_to, status);

-- Triggers
CREATE TRIGGER update_weekly_meetings_modtime
  BEFORE UPDATE ON public.weekly_meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

CREATE TRIGGER update_meeting_action_items_modtime
  BEFORE UPDATE ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- RLS
ALTER TABLE public.weekly_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly meetings select" ON public.weekly_meetings FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('reporting_officer', 'management') OR
    department_id = public.get_user_department(auth.uid())
  );

CREATE POLICY "Weekly meetings write" ON public.weekly_meetings FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');

CREATE POLICY "Meeting attendees select" ON public.meeting_attendees FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Meeting attendees write" ON public.meeting_attendees FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');

CREATE POLICY "Meeting action items select" ON public.meeting_action_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Meeting action items write" ON public.meeting_action_items FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (public.get_user_role(auth.uid()) = 'reporting_officer');
