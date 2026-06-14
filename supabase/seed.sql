-- Seed services and folders
-- Insert folders first
INSERT INTO public.services (id, name, website_url, is_folder, category, display_order) VALUES
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A.I Tools', '#', TRUE, 'A.I', 1),
  ('f2c3d4e5-f6a7-8901-bcde-f12345678901', 'Entertainment', '#', TRUE, 'Streaming', 2)
ON CONFLICT (name) DO NOTHING;

-- Insert services under folders or directly
INSERT INTO public.services (id, name, website_url, folder_id, category, display_order) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ChatGPT', 'https://chatgpt.com', 'f1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A.I', 1),
  ('a2b2c3d4-e5f6-7890-abcd-ef1234567890', 'Claude', 'https://claude.ai', 'f1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A.I', 2),
  ('a3b2c3d4-e5f6-7890-abcd-ef1234567890', 'Perplexity', 'https://perplexity.ai', 'f1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A.I', 3),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Netflix', 'https://www.netflix.com', 'f2c3d4e5-f6a7-8901-bcde-f12345678901', 'Streaming', 1),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Spotify', 'https://www.spotify.com', 'f2c3d4e5-f6a7-8901-bcde-f12345678901', 'Streaming', 2),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Canva', 'https://www.canva.com', NULL, 'Design', 3),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Adobe Creative Cloud', 'https://www.adobe.com', NULL, 'Design', 4)
ON CONFLICT (name) DO NOTHING;
