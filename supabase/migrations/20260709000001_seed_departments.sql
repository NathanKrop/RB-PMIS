INSERT INTO public.departments (name) VALUES
  ('Building and Construction (Electricals and Plumbing)'),
  ('Solar Technology'),
  ('Fashion and Design'),
  ('Food and Beverage'),
  ('ICT'),
  ('Beadwork'),
  ('Entrepreneurship'),
  ('Cosmetology')
ON CONFLICT (name) DO NOTHING;

SELECT * FROM public.departments;
