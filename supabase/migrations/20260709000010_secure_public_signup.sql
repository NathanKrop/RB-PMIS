-- Public registration may only create department users. Privileged accounts
-- must be provisioned through a controlled administrative process.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_department_id UUID;
BEGIN
  SELECT id
  INTO selected_department_id
  FROM public.departments
  WHERE id::text = NEW.raw_user_meta_data->>'department_id';

  INSERT INTO public.users (id, email, full_name, role, department_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'department_user'::public.user_role,
    selected_department_id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_role(target_user_id UUID)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.prevent_authenticated_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() = 'authenticated' THEN
    RAISE EXCEPTION 'Only controlled administrative provisioning may change user roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_authenticated_role_change ON public.users;
CREATE TRIGGER prevent_authenticated_role_change
  BEFORE UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_authenticated_role_change();

DROP POLICY "Profiles can be updated by owner or reporting officers" ON public.users;

CREATE POLICY "Profiles can be updated without changing roles"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'reporting_officer')
  WITH CHECK (
    role = public.get_profile_role(id)
    AND (
      auth.uid() = id
      OR public.get_user_role(auth.uid()) = 'reporting_officer'
    )
  );
