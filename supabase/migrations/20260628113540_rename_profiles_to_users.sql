-- Rename profiles table to users (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles RENAME TO users;
  END IF;
END $$;

-- Update handle_new_user to reference users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'visitante'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_admin to reference users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Update get_user_role to reference users table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_select" ON public.users;
DROP POLICY IF EXISTS "users_admin_update" ON public.users;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Ensure seed user exists in users table
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, full_name, role)
    VALUES (v_user_id, 'Andre Almeida', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Andre Almeida';
  END IF;
END $$;

-- Seed data for auxiliary tables
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.plano_contas (user_id, classificacao, descricao, tipo) VALUES
      (v_user_id, '1.1.01.001', 'Banco conta movimento', 'analitica'),
      (v_user_id, '1.1.01.002', 'Caixa', 'analitica'),
      (v_user_id, '2.1.02.003', 'Fornecedores nacionais', 'analitica'),
      (v_user_id, '5.1.01.001', 'Entrada de mercadorias', 'analitica'),
      (v_user_id, '3.1.01.001', 'Receitas de Vendas', 'sintetica')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.centro_custos (user_id, centro_de_custos) VALUES
      (v_user_id, 'Administrativo'),
      (v_user_id, 'Comercial'),
      (v_user_id, 'Operacional'),
      (v_user_id, 'Financeiro')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.atividades (user_id, atividade) VALUES
      (v_user_id, 'Venda de Produtos'),
      (v_user_id, 'Prestacao de Servicos'),
      (v_user_id, 'Compra de Insumos'),
      (v_user_id, 'Transporte')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
