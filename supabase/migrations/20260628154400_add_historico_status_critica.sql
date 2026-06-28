-- Add historico and status columns to critica table
-- Make category and payment_method nullable (no longer collected in forms)

ALTER TABLE public.critica ADD COLUMN IF NOT EXISTS historico TEXT;
ALTER TABLE public.critica ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';

ALTER TABLE public.critica ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.critica ALTER COLUMN payment_method DROP NOT NULL;
