-- Departments can contain specialist fields. Trainers are assigned to the
-- most specific department or field that represents their area of practice.
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

UPDATE public.departments SET name = 'Plumbing' WHERE name = 'Building and Construction (Electricals and Plumbing)';
UPDATE public.departments SET name = 'Solar PV Installation' WHERE name = 'Solar Technology';
UPDATE public.departments SET name = 'Food Production' WHERE name = 'Food and Beverage';
UPDATE public.departments SET name = 'MSME' WHERE name = 'Entrepreneurship';

INSERT INTO public.departments (name) VALUES
  ('ICT'), ('Plumbing'), ('Electrical Installation'), ('Solar PV Installation'),
  ('Cosmetology'), ('Food Production'), ('Beadwork'), ('Crochet'),
  ('Fashion and Design'), ('Reproductive Health'), ('MSME'),
  ('Agriculture and Entrepreneurship'), ('MERL'), ('Mentorship'),
  ('Communication and Media'), ('Community Engagement'), ('Career Resource')
ON CONFLICT (name) DO NOTHING;

UPDATE public.departments AS field SET parent_department_id = department.id
FROM public.departments AS department
WHERE (field.name = 'Crochet' AND department.name = 'Beadwork')
   OR (field.name = 'Agriculture and Entrepreneurship' AND department.name = 'MSME');

