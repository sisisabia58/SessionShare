-- Create storage bucket for service icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-icons', 'service-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for service icons
-- Allow public access to read icons
CREATE POLICY "Allow public read access to service icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-icons');

-- Allow admins full access to service icons
CREATE POLICY "Allow admins full access to service icons"
ON storage.objects FOR ALL
USING (bucket_id = 'service-icons' AND public.is_admin())
WITH CHECK (bucket_id = 'service-icons' AND public.is_admin());
