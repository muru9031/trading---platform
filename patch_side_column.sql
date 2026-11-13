-- Add 'side' column to journal_entries table for Long/Short trade tracking
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS side text DEFAULT 'Buy';
