INSERT INTO public.services (id, name, website_url, icon_url) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ChatGPT', 'https://chat.openai.com', NULL),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Canva', 'https://www.canva.com', NULL),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Netflix', 'https://www.netflix.com', NULL),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Spotify', 'https://www.spotify.com', NULL),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Adobe Creative Cloud', 'https://www.adobe.com', NULL)
ON CONFLICT (name) DO NOTHING;
