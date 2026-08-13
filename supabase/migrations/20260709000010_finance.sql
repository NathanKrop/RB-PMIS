-- Finance: budget lines and expenditures

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_line_status') THEN
    CREATE TYPE budget_line_status AS ENUM ('draft', 'approved', 'closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expenditure_status') THEN
    CREATE TYPE expenditure_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_category') THEN
    CREATE TYPE budget_category AS ENUM ('personnel', 'operations', 'capital', 'transfers', 'other');
  END IF;
END $$;

-- Add finance to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance';

CREATE TABLE IF NOT EXISTS budget_lines (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id     uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  activity_id       uuid REFERENCES activities(id) ON DELETE SET NULL,
  title             text NOT NULL,
  category          budget_category NOT NULL DEFAULT 'other',
  fiscal_year       text NOT NULL,
  amount_approved   numeric(15,2) NOT NULL DEFAULT 0,
  amount_revised    numeric(15,2),
  status            budget_line_status NOT NULL DEFAULT 'draft',
  notes             text,
  created_by        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenditures (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_id      uuid NOT NULL REFERENCES budget_lines(id) ON DELETE CASCADE,
  department_id       uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  description         text NOT NULL,
  amount              numeric(15,2) NOT NULL,
  expenditure_date    date NOT NULL,
  payment_reference   text,
  status              expenditure_status NOT NULL DEFAULT 'pending',
  reviewed_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes               text,
  created_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Triggers for updated_at (idempotent)
DROP TRIGGER IF EXISTS set_budget_lines_updated_at ON public.budget_lines;
CREATE TRIGGER set_budget_lines_updated_at
  BEFORE UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

DROP TRIGGER IF EXISTS set_expenditures_updated_at ON public.expenditures;
CREATE TRIGGER set_expenditures_updated_at
  BEFORE UPDATE ON public.expenditures
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- RLS
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_budget_lines_all" ON public.budget_lines;
CREATE POLICY "finance_budget_lines_all" ON public.budget_lines
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid())::text = 'finance')
  WITH CHECK (public.get_user_role(auth.uid())::text = 'finance');

DROP POLICY IF EXISTS "finance_expenditures_all" ON public.expenditures;
CREATE POLICY "finance_expenditures_all" ON public.expenditures
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid())::text = 'finance')
  WITH CHECK (public.get_user_role(auth.uid())::text = 'finance');

-- Management: read-only
DROP POLICY IF EXISTS "management_budget_lines_read" ON public.budget_lines;
CREATE POLICY "management_budget_lines_read" ON public.budget_lines
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'management');

DROP POLICY IF EXISTS "management_expenditures_read" ON public.expenditures;
CREATE POLICY "management_expenditures_read" ON public.expenditures
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'management');

-- Reporting officer: read-only
DROP POLICY IF EXISTS "officer_budget_lines_read" ON public.budget_lines;
CREATE POLICY "officer_budget_lines_read" ON public.budget_lines
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer');

DROP POLICY IF EXISTS "officer_expenditures_read" ON public.expenditures;
CREATE POLICY "officer_expenditures_read" ON public.expenditures
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'reporting_officer');
