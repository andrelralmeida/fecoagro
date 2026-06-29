ALTER TABLE public.critica ADD COLUMN IF NOT EXISTS filial_id BIGINT REFERENCES public.filiais(id) ON DELETE SET NULL;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS filial_id BIGINT REFERENCES public.filiais(id) ON DELETE SET NULL;
ALTER TABLE public.razao ADD COLUMN IF NOT EXISTS filial_id BIGINT REFERENCES public.filiais(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS critica_filial_id_idx ON public.critica(filial_id);
CREATE INDEX IF NOT EXISTS notas_fiscais_filial_id_idx ON public.notas_fiscais(filial_id);
CREATE INDEX IF NOT EXISTS razao_filial_id_idx ON public.razao(filial_id);
