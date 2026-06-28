-- Fix get_dashboard_kpi to use 'fornecedor' instead of legacy 'emissor' column
-- The notas_fiscais table was renamed from 'emissor' to 'fornecedor'
-- This migration is idempotent: uses CREATE OR REPLACE FUNCTION

CREATE OR REPLACE FUNCTION public.get_dashboard_kpi(p_date_now DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total_criticas INTEGER;
  v_pending_criticas INTEGER;
  v_unreconciled_criticas INTEGER;
  v_completed_criticas INTEGER;
  v_razao_balance NUMERIC;
  v_bank_balance NUMERIC;
  v_total_criticas_amount NUMERIC;
  v_monthly_movement NUMERIC;
  v_supplier_volumes JSON;
BEGIN
  SELECT COUNT(*) INTO v_total_criticas FROM public.critica;
  SELECT COUNT(*) INTO v_pending_criticas FROM public.critica WHERE status = 'pendente';
  SELECT COUNT(*) INTO v_unreconciled_criticas FROM public.critica WHERE reconciled = false;
  SELECT COUNT(*) INTO v_completed_criticas FROM public.critica WHERE status = 'concluido';
  SELECT COALESCE(SUM(amount), 0) INTO v_total_criticas_amount FROM public.critica;
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_movement FROM public.critica
    WHERE date >= date_trunc('month', p_date_now) AND date <= p_date_now;
  SELECT COALESCE(SUM(saldo), 0) INTO v_razao_balance FROM public.razao;
  SELECT COALESCE(SUM(saldo_atual), 0) INTO v_bank_balance FROM public.bancos;

  -- Aggregate supplier (fornecedor) volumes from notas_fiscais
  -- Uses 'fornecedor' column (renamed from 'emissor')
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_supplier_volumes
  FROM (
    SELECT
      fornecedor,
      SUM(valor_total) AS total,
      COUNT(*) AS nota_count
    FROM public.notas_fiscais
    WHERE data_emissao <= p_date_now
    GROUP BY fornecedor
    ORDER BY SUM(valor_total) DESC
  ) t;

  RETURN json_build_object(
    'totalCriticas', v_total_criticas,
    'pendingCriticas', v_pending_criticas,
    'unreconciledCriticas', v_unreconciled_criticas,
    'completedCriticas', v_completed_criticas,
    'totalCriticasAmount', v_total_criticas_amount,
    'razaoBalance', v_razao_balance,
    'bankBalance', v_bank_balance,
    'monthlyMovement', v_monthly_movement,
    'supplierVolumes', v_supplier_volumes
  );
END;
$$;
