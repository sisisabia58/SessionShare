-- Extend services table for categories, folders, and sorting
ALTER TABLE public.services ADD COLUMN category TEXT;
ALTER TABLE public.services ADD COLUMN folder_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE public.services ADD COLUMN is_folder BOOLEAN DEFAULT FALSE;

-- Create index on folder_id to optimize nested queries
CREATE INDEX idx_services_folder_id ON public.services(folder_id);
