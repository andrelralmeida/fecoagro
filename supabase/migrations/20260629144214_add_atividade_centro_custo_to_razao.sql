-- Add atividade_id and centro_custo_id columns to razao table
-- Idempotent: safe to run even if columns already exist

ALTER TABLE public.razao
  ADD COLUMN IF NOT EXISTS atividade_id BIGINT REFERENCES public.atividades(id) ON DELETE SET NULL;

ALTER TABLE public.razao
  ADD COLUMN IF NOT EXISTS centro_custo_id BIGINT REFERENCES public.centro_custos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS razao_atividade_id_idx ON public.razao(atividade_id);
CREATE INDEX IF NOT EXISTS razao_centro_custo_id_idx ON public.razao(centro_custo_id);
