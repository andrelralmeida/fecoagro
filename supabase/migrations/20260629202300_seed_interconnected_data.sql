-- Seed interconnected sample data across all operational tables
-- 3 sets of records demonstrating full reconciliation cycle

DO $$
DECLARE
  v_user_id uuid;
  v_filial_1 bigint;
  v_filial_2 bigint;
  v_filial_3 bigint;
  v_banco_id bigint;
  v_plano_receita_id bigint;
  v_plano_despesa_id bigint;
  v_atividade_id bigint;
  v_centro_custo_id bigint;
  v_nota_1 bigint;
  v_nota_2 bigint;
  v_nota_3 bigint;
  v_razao_1 bigint;
  v_razao_2 bigint;
  v_razao_3 bigint;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br' LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Ensure 3 filiais
  INSERT INTO public.filiais (filial, cnpj, user_id) VALUES
    ('Matriz - Campinas', '12.345.678/0001-90', v_user_id),
    ('Filial - São Paulo', '12.345.678/0002-71', v_user_id),
    ('Filial - Ribeirão Preto', '12.345.678/0003-52', v_user_id)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_filial_1 FROM public.filiais WHERE user_id = v_user_id AND filial = 'Matriz - Campinas' LIMIT 1;
  SELECT id INTO v_filial_2 FROM public.filiais WHERE user_id = v_user_id AND filial = 'Filial - São Paulo' LIMIT 1;
  SELECT id INTO v_filial_3 FROM public.filiais WHERE user_id = v_user_id AND filial = 'Filial - Ribeirão Preto' LIMIT 1;

  -- Ensure a banco exists
  INSERT INTO public.bancos (banco, saldo_atual, user_id)
  SELECT 'Banco do Brasil', 50000.00, v_user_id
  WHERE NOT EXISTS (SELECT 1 FROM public.bancos WHERE user_id = v_user_id LIMIT 1);

  SELECT id INTO v_banco_id FROM public.bancos WHERE user_id = v_user_id ORDER BY id LIMIT 1;

  -- Ensure plano_contas for receita and despesa
  INSERT INTO public.plano_contas (classificacao, descricao, tipo, user_id)
  SELECT '3.1.01', 'Receitas de Vendas', 'analitica', v_user_id
  WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = v_user_id AND classificacao = '3.1.01');

  INSERT INTO public.plano_contas (classificacao, descricao, tipo, user_id)
  SELECT '4.1.01', 'Despesas Operacionais', 'analitica', v_user_id
  WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas WHERE user_id = v_user_id AND classificacao = '4.1.01');

  SELECT id INTO v_plano_receita_id FROM public.plano_contas WHERE user_id = v_user_id AND classificacao = '3.1.01' LIMIT 1;
  SELECT id INTO v_plano_despesa_id FROM public.plano_contas WHERE user_id = v_user_id AND classificacao = '4.1.01' LIMIT 1;

  -- Ensure atividade and centro_custo
  INSERT INTO public.atividades (atividade, user_id)
  SELECT 'Comércio de Grãos', v_user_id
  WHERE NOT EXISTS (SELECT 1 FROM public.atividades WHERE user_id = v_user_id LIMIT 1);

  INSERT INTO public.centro_custos (centro_de_custos, user_id)
  SELECT 'Administrativo', v_user_id
  WHERE NOT EXISTS (SELECT 1 FROM public.centro_custos WHERE user_id = v_user_id LIMIT 1);

  SELECT id INTO v_atividade_id FROM public.atividades WHERE user_id = v_user_id ORDER BY id LIMIT 1;
  SELECT id INTO v_centro_custo_id FROM public.centro_custos WHERE user_id = v_user_id ORDER BY id LIMIT 1;

  -- 3 Notas Fiscais (one per filial)
  IF NOT EXISTS (SELECT 1 FROM public.notas_fiscais WHERE user_id = v_user_id AND filial_id = v_filial_1 AND numero_nota = 2001) THEN
    INSERT INTO public.notas_fiscais (user_id, numero_nota, data_emissao, fornecedor, valor_total, status, filial_id)
    VALUES
      (v_user_id, 2001, '2026-06-10', 'Cooperativa Fecoagro', 15000.00, 'pendente', v_filial_1),
      (v_user_id, 2002, '2026-06-12', 'Fornecedor Agro LTDA', 8500.00, 'pendente', v_filial_2),
      (v_user_id, 2003, '2026-06-15', 'Transportadora Sul', 3200.00, 'pendente', v_filial_3);
  END IF;

  SELECT id INTO v_nota_1 FROM public.notas_fiscais WHERE user_id = v_user_id AND filial_id = v_filial_1 AND numero_nota = 2001 LIMIT 1;
  SELECT id INTO v_nota_2 FROM public.notas_fiscais WHERE user_id = v_user_id AND filial_id = v_filial_2 AND numero_nota = 2002 LIMIT 1;
  SELECT id INTO v_nota_3 FROM public.notas_fiscais WHERE user_id = v_user_id AND filial_id = v_filial_3 AND numero_nota = 2003 LIMIT 1;

  -- 3 Critica records (linked to notas and filiais)
  IF NOT EXISTS (SELECT 1 FROM public.critica WHERE user_id = v_user_id AND nota_fiscal_id = v_nota_1) THEN
    INSERT INTO public.critica (user_id, date, historico, amount, status, reconciled, filial_id, nota_fiscal_id, plano_conta_id, atividade_id, centro_custo_id)
    VALUES
      (v_user_id, '2026-06-10', 'Venda de grãos - NF 2001', 15000.00, 'pendente', false, v_filial_1, v_nota_1, v_plano_receita_id, v_atividade_id, v_centro_custo_id),
      (v_user_id, '2026-06-12', 'Compra de insumos - NF 2002', 8500.00, 'pendente', false, v_filial_2, v_nota_2, v_plano_despesa_id, v_atividade_id, v_centro_custo_id),
      (v_user_id, '2026-06-15', 'Frete - NF 2003', 3200.00, 'pendente', false, v_filial_3, v_nota_3, v_plano_despesa_id, v_atividade_id, v_centro_custo_id);
  END IF;

  -- 3 Razao records (linked to filiais and plano_contas)
  IF NOT EXISTS (SELECT 1 FROM public.razao WHERE user_id = v_user_id AND filial_id = v_filial_1 AND historico = 'Venda de grãos - NF 2001') THEN
    INSERT INTO public.razao (user_id, data, conta, historico, debito, credito, saldo, plano_conta_id, filial_id, atividade_id, centro_custo_id)
    VALUES
      (v_user_id, '2026-06-10', '3.1.01', 'Venda de grãos - NF 2001', 0, 15000.00, 15000.00, v_plano_receita_id, v_filial_1, v_atividade_id, v_centro_custo_id),
      (v_user_id, '2026-06-12', '4.1.01', 'Compra de insumos - NF 2002', 8500.00, 0, -8500.00, v_plano_despesa_id, v_filial_2, v_atividade_id, v_centro_custo_id),
      (v_user_id, '2026-06-15', '4.1.01', 'Frete - NF 2003', 3200.00, 0, -3200.00, v_plano_despesa_id, v_filial_3, v_atividade_id, v_centro_custo_id);
  END IF;

  SELECT id INTO v_razao_1 FROM public.razao WHERE user_id = v_user_id AND filial_id = v_filial_1 AND historico = 'Venda de grãos - NF 2001' ORDER BY id DESC LIMIT 1;
  SELECT id INTO v_razao_2 FROM public.razao WHERE user_id = v_user_id AND filial_id = v_filial_2 AND historico = 'Compra de insumos - NF 2002' ORDER BY id DESC LIMIT 1;
  SELECT id INTO v_razao_3 FROM public.razao WHERE user_id = v_user_id AND filial_id = v_filial_3 AND historico = 'Frete - NF 2003' ORDER BY id DESC LIMIT 1;

  -- 3 Extratos Bancarios (linked to razao via razao_id, reconciled=true)
  IF NOT EXISTS (SELECT 1 FROM public.extratos_bancarios WHERE user_id = v_user_id AND razao_id IS NOT NULL LIMIT 1) THEN
    INSERT INTO public.extratos_bancarios (user_id, banco_id, data, descricao, valor, tipo, razao_id, reconciled)
    VALUES
      (v_user_id, v_banco_id, '2026-06-10', 'Recebimento NF 2001', 15000.00, 'credit', v_razao_1, true),
      (v_user_id, v_banco_id, '2026-06-12', 'Pagamento NF 2002', 8500.00, 'debit', v_razao_2, true),
      (v_user_id, v_banco_id, '2026-06-15', 'Pagamento NF 2003', 3200.00, 'debit', v_razao_3, true);
  END IF;
END $$;
