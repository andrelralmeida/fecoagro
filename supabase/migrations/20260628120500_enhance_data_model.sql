-- Enhance data model: relationships, reconciliation, indexes, constraints

-- Add nota_fiscal_id to transactions (link notas_fiscais to transactions)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS nota_fiscal_id UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL;

-- Add plano_conta_id to razao (link razao entries to plano_contas)
ALTER TABLE public.razao ADD COLUMN IF NOT EXISTS plano_conta_id UUID REFERENCES public.plano_contas(id) ON DELETE SET NULL;

-- Add reconciled to transactions (for bank statement reconciliation)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reconciled BOOLEAN NOT NULL DEFAULT FALSE;

-- Performance indexes on frequently filtered columns
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date);
CREATE INDEX IF NOT EXISTS transactions_reconciled_idx ON public.transactions(reconciled);
CREATE INDEX IF NOT EXISTS transactions_nota_fiscal_id_idx ON public.transactions(nota_fiscal_id);
CREATE INDEX IF NOT EXISTS notas_fiscais_user_id_idx ON public.notas_fiscais(user_id);
CREATE INDEX IF NOT EXISTS notas_fiscais_status_idx ON public.notas_fiscais(status);
CREATE INDEX IF NOT EXISTS razao_user_id_idx ON public.razao(user_id);
CREATE INDEX IF NOT EXISTS razao_data_idx ON public.razao(data);
CREATE INDEX IF NOT EXISTS razao_plano_conta_id_idx ON public.razao(plano_conta_id);
CREATE INDEX IF NOT EXISTS bancos_user_id_idx ON public.bancos(user_id);
CREATE INDEX IF NOT EXISTS plano_contas_user_id_idx ON public.plano_contas(user_id);
CREATE INDEX IF NOT EXISTS centro_custos_user_id_idx ON public.centro_custos(user_id);
CREATE INDEX IF NOT EXISTS atividades_user_id_idx ON public.atividades(user_id);

-- Add CHECK constraint on notas_fiscais.status for data integrity
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_status_check') THEN
    ALTER TABLE public.notas_fiscais ADD CONSTRAINT notas_fiscais_status_check
      CHECK (status IN ('pendente', 'aprovada', 'cancelada'));
  END IF;
END $$;
