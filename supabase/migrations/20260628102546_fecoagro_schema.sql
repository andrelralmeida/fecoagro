-- Fecoagro Schema: New tables, RLS policies, storage bucket, and seed user

-- Storage bucket for PDF imports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imports', 'imports', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for imports bucket
DROP POLICY IF EXISTS "imports_select" ON storage.objects;
CREATE POLICY "imports_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'imports');

DROP POLICY IF EXISTS "imports_insert" ON storage.objects;
CREATE POLICY "imports_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imports');

DROP POLICY IF EXISTS "imports_delete" ON storage.objects;
CREATE POLICY "imports_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'imports');

-- =============================================
-- Table: notas_fiscais
-- =============================================
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero_nota TEXT NOT NULL,
  data_emissao DATE NOT NULL,
  emissor TEXT NOT NULL,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_fiscais_select" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_select" ON public.notas_fiscais
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notas_fiscais_insert" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_insert" ON public.notas_fiscais
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notas_fiscais_update" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_update" ON public.notas_fiscais
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notas_fiscais_delete" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_delete" ON public.notas_fiscais
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- Table: razao
-- =============================================
CREATE TABLE IF NOT EXISTS public.razao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  conta TEXT NOT NULL,
  descricao TEXT NOT NULL,
  debito NUMERIC NOT NULL DEFAULT 0,
  credito NUMERIC NOT NULL DEFAULT 0,
  saldo NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.razao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "razao_select" ON public.razao;
CREATE POLICY "razao_select" ON public.razao
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "razao_insert" ON public.razao;
CREATE POLICY "razao_insert" ON public.razao
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "razao_update" ON public.razao;
CREATE POLICY "razao_update" ON public.razao
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "razao_delete" ON public.razao;
CREATE POLICY "razao_delete" ON public.razao
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- Table: bancos
-- =============================================
CREATE TABLE IF NOT EXISTS public.bancos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta_corrente TEXT NOT NULL,
  saldo_atual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bancos_select" ON public.bancos;
CREATE POLICY "bancos_select" ON public.bancos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bancos_insert" ON public.bancos;
CREATE POLICY "bancos_insert" ON public.bancos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bancos_update" ON public.bancos;
CREATE POLICY "bancos_update" ON public.bancos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bancos_delete" ON public.bancos;
CREATE POLICY "bancos_delete" ON public.bancos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- Seed User: andre@almeida.com.br
-- =============================================
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'andre@almeida.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
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

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (new_user_id, 'Andre Almeida', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Andre Almeida';
  END IF;
END $$;

-- =============================================
-- Seed Data for new tables
-- =============================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notas_fiscais (user_id, numero_nota, data_emissao, emissor, valor_total, status) VALUES
      (v_user_id, 'NF-001289', '2026-06-15', 'Cooperativa Fecoagro', 15420.50, 'aprovada'),
      (v_user_id, 'NF-001290', '2026-06-18', 'Fornecedor Agro LTDA', 3250.00, 'pendente'),
      (v_user_id, 'NF-001291', '2026-06-22', 'Transportadora Sul', 890.75, 'pendente')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.razao (user_id, data, conta, descricao, debito, credito, saldo) VALUES
      (v_user_id, '2026-06-15', '5.1.01.001', 'Entrada de mercadorias', 15420.50, 0, 15420.50),
      (v_user_id, '2026-06-18', '2.1.02.003', 'Fornecedores nacionais', 0, 3250.00, 12170.50),
      (v_user_id, '2026-06-22', '1.1.01.002', 'Banco conta movimento', 890.75, 0, 11279.75)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.bancos (user_id, banco, agencia, conta_corrente, saldo_atual) VALUES
      (v_user_id, 'Banco do Brasil', '1234-5', '67890-1', 45820.30),
      (v_user_id, 'Sicredi', '0710', '89012-3', 23150.00),
      (v_user_id, 'Bradesco', '2981', '34567-8', 8900.75)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
