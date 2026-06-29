-- Populate plano_contas with full Chart of Accounts for andre@almeida.com.br
-- Idempotent, with cleanup of existing data for the user

-- =============================================
-- 1. Ensure seed user exists in auth.users
-- =============================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'andre@almeida.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'andre@almeida.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Andre Almeida"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;

  -- Ensure user exists in public.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, full_name, role)
    VALUES (v_user_id, 'Andre Almeida', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Andre Almeida';
  END IF;
END $$;

-- =============================================
-- 2. Ensure RLS policies on plano_contas
-- =============================================
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plano_contas_select" ON public.plano_contas;
CREATE POLICY "plano_contas_select" ON public.plano_contas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "plano_contas_insert" ON public.plano_contas;
CREATE POLICY "plano_contas_insert" ON public.plano_contas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "plano_contas_update" ON public.plano_contas;
CREATE POLICY "plano_contas_update" ON public.plano_contas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "plano_contas_delete" ON public.plano_contas;
CREATE POLICY "plano_contas_delete" ON public.plano_contas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 3. Cleanup existing plano_contas data for the user
-- =============================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.plano_contas WHERE user_id = v_user_id;
  END IF;
END $$;

-- =============================================
-- 4. Insert full Chart of Accounts
--    - id: from "Reduzido" (analytical) or generated sequential (synthetic)
--    - classificacao: from "Conta"
--    - descricao: from "Descricao"
--    - tipo: 'sintetica' (no Reduzido) or 'analitica' (has Reduzido)
-- =============================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br';
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- ATIVO
  -- Synthetic accounts use IDs in the 9000000+ range to avoid collision with "Reduzido" IDs
  INSERT INTO public.plano_contas (id, user_id, classificacao, descricao, tipo) VALUES
    (9000001, v_user_id, '1', 'ATIVO', 'sintetica'),
    (9000002, v_user_id, '1.01', 'ATIVO CIRCULANTE', 'sintetica'),
    (9000003, v_user_id, '1.01.01', 'DISPONIBILIDADES', 'sintetica'),
    (1001, v_user_id, '1.01.01.01.01', 'Caixa', 'analitica'),
    (1002, v_user_id, '1.01.01.01.02', 'Bancos Conta Movimento', 'analitica'),
    (1003, v_user_id, '1.01.01.01.03', 'Aplicações Financeiras', 'analitica'),
    (9000004, v_user_id, '1.01.02', 'CRÉDITOS DE CIRCULAÇÃO', 'sintetica'),
    (9000005, v_user_id, '1.01.02.01', 'Clientes Nacionais', 'sintetica'),
    (1101, v_user_id, '1.01.02.01.01', 'Clientes a Receber', 'analitica'),
    (1102, v_user_id, '1.01.02.01.02', 'Clientes - Duplicatas a Receber', 'analitica'),
    (9000006, v_user_id, '1.01.02.02', 'Outros Créditos', 'sintetica'),
    (1103, v_user_id, '1.01.02.02.01', 'Adiantamentos a Fornecedores', 'analitica'),
    (1104, v_user_id, '1.01.02.02.02', 'Adiantamentos a Empregados', 'analitica'),
    (9000007, v_user_id, '1.01.03', 'ESTOQUES', 'sintetica'),
    (9000008, v_user_id, '1.01.03.01', 'Matérias-Primas', 'sintetica'),
    (1201, v_user_id, '1.01.03.01.01', 'Estoque de Insumos Agrícolas', 'analitica'),
    (1202, v_user_id, '1.01.03.01.02', 'Estoque de Produtos Acabados', 'analitica'),
    (9000009, v_user_id, '1.01.03.02', 'Produtos em Elaboração', 'sintetica'),
    (1203, v_user_id, '1.01.03.02.01', 'Produtos em Processo', 'analitica'),
    (9000010, v_user_id, '1.02', 'ATIVO NÃO CIRCULANTE', 'sintetica'),
    (9000011, v_user_id, '1.02.01', 'ATIVO REALIZÁVEL A LONGO PRAZO', 'sintetica'),
    (9000012, v_user_id, '1.02.01.01', 'Créditos a Longo Prazo', 'sintetica'),
    (1301, v_user_id, '1.02.01.01.01', 'Clientes a Longo Prazo', 'analitica'),
    (1302, v_user_id, '1.02.01.01.02', 'Títulos a Receber Longo Prazo', 'analitica'),
    (9000013, v_user_id, '1.02.02', 'INVESTIMENTOS', 'sintetica'),
    (1303, v_user_id, '1.02.02.01.01', 'Investimentos em Coligadas', 'analitica'),
    (9000014, v_user_id, '1.02.03', 'IMOBILIZADO', 'sintetica'),
    (9000015, v_user_id, '1.02.03.01', 'Bens Imóveis', 'sintetica'),
    (1401, v_user_id, '1.02.03.01.01', 'Terrenos', 'analitica'),
    (1402, v_user_id, '1.02.03.01.02', 'Edifícios e Construções', 'analitica'),
    (9000016, v_user_id, '1.02.03.02', 'Bens Móveis', 'sintetica'),
    (1403, v_user_id, '1.02.03.02.01', 'Máquinas e Equipamentos', 'analitica'),
    (1404, v_user_id, '1.02.03.02.02', 'Móveis e Utensílios', 'analitica'),
    (1405, v_user_id, '1.02.03.02.03', 'Veículos', 'analitica'),
    (9000017, v_user_id, '1.02.03.03', 'Depreciação Acumulada', 'sintetica'),
    (1406, v_user_id, '1.02.03.03.01', 'Depreciação Acumulada de Imóveis', 'analitica'),
    (1407, v_user_id, '1.02.03.03.02', 'Depreciação Acumulada de Móveis e Utensílios', 'analitica'),
    (1408, v_user_id, '1.02.03.03.03', 'Depreciação Acumulada de Veículos', 'analitica'),
    (9000018, v_user_id, '1.02.04', 'INTANGÍVEL', 'sintetica'),
    (1501, v_user_id, '1.02.04.01.01', 'Software e Licenças', 'analitica'),
    (1502, v_user_id, '1.02.04.01.02', 'Marcas e Patentes', 'analitica'),

    -- PASSIVO
    (9000019, v_user_id, '2', 'PASSIVO', 'sintetica'),
    (9000020, v_user_id, '2.01', 'PASSIVO CIRCULANTE', 'sintetica'),
    (9000021, v_user_id, '2.01.01', 'Fornecedores', 'sintetica'),
    (2001, v_user_id, '2.01.01.01.01', 'Fornecedores Nacionais', 'analitica'),
    (2002, v_user_id, '2.01.01.01.02', 'Fornecedores Estrangeiros', 'analitica'),
    (9000022, v_user_id, '2.01.02', 'Obrigações Fiscais', 'sintetica'),
    (2101, v_user_id, '2.01.02.01.01', 'ICMS a Recolher', 'analitica'),
    (2102, v_user_id, '2.01.02.01.02', 'IPI a Recolher', 'analitica'),
    (2103, v_user_id, '2.01.02.01.03', 'PIS a Recolher', 'analitica'),
    (2104, v_user_id, '2.01.02.01.04', 'COFINS a Recolher', 'analitica'),
    (2105, v_user_id, '2.01.02.01.05', 'IRPJ a Recolher', 'analitica'),
    (2106, v_user_id, '2.01.02.01.06', 'CSLL a Recolher', 'analitica'),
    (9000023, v_user_id, '2.01.03', 'Obrigações Trabalhistas', 'sintetica'),
    (2201, v_user_id, '2.01.03.01.01', 'Salários a Pagar', 'analitica'),
    (2202, v_user_id, '2.01.03.01.02', 'INSS a Recolher', 'analitica'),
    (2203, v_user_id, '2.01.03.01.03', 'FGTS a Recolher', 'analitica'),
    (9000024, v_user_id, '2.01.04', 'Empréstimos e Financiamentos', 'sintetica'),
    (2301, v_user_id, '2.01.04.01.01', 'Empréstimos Bancários Curto Prazo', 'analitica'),
    (2302, v_user_id, '2.01.04.01.02', 'Financiamentos Curto Prazo', 'analitica'),
    (9000025, v_user_id, '2.02', 'PASSIVO NÃO CIRCULANTE', 'sintetica'),
    (9000026, v_user_id, '2.02.01', 'Empréstimos e Financiamentos Longo Prazo', 'sintetica'),
    (2401, v_user_id, '2.02.01.01.01', 'Empréstimos Bancários Longo Prazo', 'analitica'),
    (2402, v_user_id, '2.02.01.01.02', 'Financiamentos Longo Prazo', 'analitica'),
    (9000027, v_user_id, '2.02.02', 'Provisões', 'sintetica'),
    (2501, v_user_id, '2.02.02.01.01', 'Provisão para Férias', 'analitica'),
    (2502, v_user_id, '2.02.02.01.02', 'Provisão para 13º Salário', 'analitica'),
    (2503, v_user_id, '2.02.02.01.03', 'Provisão para Processos Trabalhistas', 'analitica'),

    -- PATRIMÔNIO LÍQUIDO
    (9000028, v_user_id, '2.03', 'PATRIMÔNIO LÍQUIDO', 'sintetica'),
    (9000029, v_user_id, '2.03.01', 'Capital Social', 'sintetica'),
    (3001, v_user_id, '2.03.01.01.01', 'Capital Subscrito', 'analitica'),
    (3002, v_user_id, '2.03.01.01.02', 'Capital a Integralizar', 'analitica'),
    (9000030, v_user_id, '2.03.02', 'Reservas de Capital', 'sintetica'),
    (3101, v_user_id, '2.03.02.01.01', 'Reserva de Ágio', 'analitica'),
    (9000031, v_user_id, '2.03.03', 'Reservas de Lucros', 'sintetica'),
    (3201, v_user_id, '2.03.03.01.01', 'Reserva Legal', 'analitica'),
    (3202, v_user_id, '2.03.03.01.02', 'Reserva Estatutária', 'analitica'),
    (3203, v_user_id, '2.03.03.01.03', 'Reserva de Retenção de Lucros', 'analitica'),
    (9000032, v_user_id, '2.03.04', 'Resultados Acumulados', 'sintetica'),
    (3301, v_user_id, '2.03.04.01.01', 'Lucros Acumulados', 'analitica'),
    (3302, v_user_id, '2.03.04.01.02', 'Prejuízos Acumulados', 'analitica'),

    -- RECEITAS
    (9000033, v_user_id, '3', 'RECEITAS', 'sintetica'),
    (9000034, v_user_id, '3.01', 'RECEITAS OPERACIONAIS', 'sintetica'),
    (9000035, v_user_id, '3.01.01', 'Receita de Vendas', 'sintetica'),
    (4001, v_user_id, '3.01.01.01.01', 'Receita de Venda de Produtos', 'analitica'),
    (4002, v_user_id, '3.01.01.01.02', 'Receita de Prestação de Serviços', 'analitica'),
    (4003, v_user_id, '3.01.01.01.03', 'Receita de Venda de Mercadorias', 'analitica'),
    (9000036, v_user_id, '3.01.02', 'Deduções de Receitas', 'sintetica'),
    (4101, v_user_id, '3.01.02.01.01', 'Vendas Canceladas', 'analitica'),
    (4102, v_user_id, '3.01.02.01.02', 'Abatimentos e Descontos', 'analitica'),
    (4103, v_user_id, '3.01.02.01.03', 'ICMS sobre Vendas', 'analitica'),
    (4104, v_user_id, '3.01.02.01.04', 'PIS sobre Vendas', 'analitica'),
    (4105, v_user_id, '3.01.02.01.05', 'COFINS sobre Vendas', 'analitica'),
    (9000037, v_user_id, '3.02', 'RECEITAS NÃO OPERACIONAIS', 'sintetica'),
    (4201, v_user_id, '3.02.01.01.01', 'Ganhos de Capital', 'analitica'),
    (4202, v_user_id, '3.02.01.01.02', 'Receitas Financeiras', 'analitica'),
    (4203, v_user_id, '3.02.01.01.03', 'Juros Recebidos', 'analitica'),

    -- CUSTOS E DESPESAS
    (9000038, v_user_id, '4', 'CUSTOS E DESPESAS', 'sintetica'),
    (9000039, v_user_id, '4.01', 'CUSTOS OPERACIONAIS', 'sintetica'),
    (9000040, v_user_id, '4.01.01', 'Custo dos Produtos Vendidos', 'sintetica'),
    (5001, v_user_id, '4.01.01.01.01', 'Custo de Matéria-Prima', 'analitica'),
    (5002, v_user_id, '4.01.01.01.02', 'Custo de Mão de Obra Direta', 'analitica'),
    (5003, v_user_id, '4.01.01.01.03', 'Custo de Insumos Agrícolas', 'analitica'),
    (5004, v_user_id, '4.01.01.01.04', 'Custos Gerais de Produção', 'analitica'),
    (9000041, v_user_id, '4.02', 'DESPESAS OPERACIONAIS', 'sintetica'),
    (9000042, v_user_id, '4.02.01', 'Despesas Administrativas', 'sintetica'),
    (6001, v_user_id, '4.02.01.01.01', 'Salários e Encargos', 'analitica'),
    (6002, v_user_id, '4.02.01.01.02', 'Despesas com Aluguel', 'analitica'),
    (6003, v_user_id, '4.02.01.01.03', 'Despesas com Energia Elétrica', 'analitica'),
    (6004, v_user_id, '4.02.01.01.04', 'Despesas com Água e Esgoto', 'analitica'),
    (6005, v_user_id, '4.02.01.01.05', 'Despesas com Material de Escritório', 'analitica'),
    (6006, v_user_id, '4.02.01.01.06', 'Despesas com Comunicações', 'analitica'),
    (6007, v_user_id, '4.02.01.01.07', 'Despesas com Software e Licenças', 'analitica'),
    (9000043, v_user_id, '4.02.02', 'Despesas Comerciais', 'sintetica'),
    (6101, v_user_id, '4.02.02.01.01', 'Despesas com Marketing', 'analitica'),
    (6102, v_user_id, '4.02.02.01.02', 'Despesas com Propaganda', 'analitica'),
    (6103, v_user_id, '4.02.02.01.03', 'Comissões sobre Vendas', 'analitica'),
    (6104, v_user_id, '4.02.02.01.04', 'Despesas com Frete', 'analitica'),
    (9000044, v_user_id, '4.02.03', 'Despesas Financeiras', 'sintetica'),
    (6201, v_user_id, '4.02.03.01.01', 'Juros Pagos', 'analitica'),
    (6202, v_user_id, '4.02.03.01.02', 'Taxas Bancárias', 'analitica'),
    (6203, v_user_id, '4.02.03.01.03', 'Despesas com Câmbio', 'analitica'),
    (9000045, v_user_id, '4.03', 'DESPESAS NÃO OPERACIONAIS', 'sintetica'),
    (6301, v_user_id, '4.03.01.01.01', 'Perdas de Capital', 'analitica'),
    (6302, v_user_id, '4.03.01.01.02', 'Multas e Penalidades', 'analitica'),

    -- OUTRAS CONTAS DE COMPENSAÇÃO
    (9000046, v_user_id, '5', 'CONTAS DE COMPENSAÇÃO', 'sintetica'),
    (9000047, v_user_id, '5.01', 'Compensação de Direitos', 'sintetica'),
    (7001, v_user_id, '5.01.01.01.01', 'Compensação de Contratos', 'analitica'),
    (9000048, v_user_id, '5.02', 'Compensação de Obrigações', 'sintetica'),
    (7101, v_user_id, '5.02.01.01.01', 'Compensação de Garantias', 'analitica')
  ON CONFLICT (id) DO NOTHING;
END $$;
