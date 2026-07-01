-- Add folder_date column to memory_folders
-- Default is CURRENT_DATE so existing and new folders get today's date automatically
ALTER TABLE public.memory_folders ADD COLUMN folder_date date NOT NULL DEFAULT CURRENT_DATE;
