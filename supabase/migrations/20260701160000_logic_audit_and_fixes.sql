-- Logic Audit & Fixes: Natureza, Analytic Enforcement, RLS Verification, Seed User
-- Idempotent migration implementing acceptance criteria fixes

-- =============================================
-- 1. Fix natureza for all existing accounts
--    1=Ativo(Devedora), 2=Passivo(Credora), 3=Receitas(Credora), 4=Despesas(Devedora), 5=Compensação(Devedora)
-- =============================================
UPDATE public.plano_contas
SET natureza = 'Devedora'
WHERE LEFT(COALESCE(classificacao, ''), 1) IN ('1', '4', '5')
  AND natureza IS DISTINCT FROM 'Devedora';

UPDATE public.plano_contas
SET natureza = 'Credora'
WHERE LEFT(COALESCE(classificacao, ''), 1) IN ('2', '3')
  AND natureza IS DISTINCT FROM 'Credora';

-- =============================================
-- 2. Auto-correct natureza trigger on plano_contas
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_correct_natureza()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.classificacao IS NOT NULL THEN
    IF LEFT(NEW.classificacao, 1) IN ('1', '4', '5') THEN
      NEW.natureza := 'Devedora';
    ELSIF LEFT(NEW.classificacao, 1) IN ('2', '3') THEN
      NEW.natureza := 'Credora';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_correct_natureza_trigger ON public.plano_contas;
CREATE TRIGGER auto_correct_natureza_trigger
  BEFORE INSERT OR UPDATE OF classificacao ON public.plano_contas
  FOR EACH ROW EXECUTE FUNCTION public.auto_correct_natureza();

-- =============================================
-- 3. Analytic account validation trigger on razao
--    Prevents using synthetic accounts in ledger entries
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_analytic_razao()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_classificacao TEXT;
  v_has_children BOOLEAN;
BEGIN
  IF NEW.plano_conta_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' OR (NEW.plano_conta_id IS DISTINCT FROM OLD.plano_conta_id) THEN
      SELECT classificacao INTO v_classificacao
      FROM public.plano_contas WHERE id = NEW.plano_conta_id;

      IF v_classificacao IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM public.plano_contas
          WHERE classificacao LIKE v_classificacao || '.%'
        ) INTO v_has_children;

        IF v_has_children THEN
          RAISE EXCEPTION 'Conta sintetica (%) nao pode ser usada em lancamentos. Use uma conta analitica.', v_classificacao;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_analytic_razao_trigger ON public.razao;
CREATE TRIGGER validate_analytic_razao_trigger
  BEFORE INSERT OR UPDATE OF plano_conta_id ON public.razao
  FOR EACH ROW EXECUTE FUNCTION public.validate_analytic_razao();

-- =============================================
-- 4. Analytic account validation trigger on critica
--    Prevents using synthetic accounts in critica entries
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_analytic_critica()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_classificacao TEXT;
  v_has_children BOOLEAN;
BEGIN
  IF NEW.plano_conta_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' OR (NEW.plano_conta_id IS DISTINCT FROM OLD.plano_conta_id) THEN
      SELECT classificacao INTO v_classificacao
      FROM public.plano_contas WHERE id = NEW.plano_conta_id;

      IF v_classificacao IS NOT NULL THEN
        SELECT EXISTS(
          SELECT 1 FROM public.plano_contas
          WHERE classificacao LIKE v_classificacao || '.%'
        ) INTO v_has_children;

        IF v_has_children THEN
          RAISE EXCEPTION 'Conta sintetica (%) nao pode ser usada em criticas. Use uma conta analitica.', v_classificacao;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_analytic_critica_trigger ON public.critica;
CREATE TRIGGER validate_analytic_critica_trigger
  BEFORE INSERT OR UPDATE OF plano_conta_id ON public.critica
  FOR EACH ROW EXECUTE FUNCTION public.validate_analytic_critica();

-- =============================================
-- 5. RLS Policy re-verification on key tables
--    Ensures authenticated users can only access their own rows
-- =============================================

-- razao
ALTER TABLE public.razao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "razao_select" ON public.razao;
CREATE POLICY "razao_select" ON public.razao
  FOR SELECT TO authenticated USING (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "razao_insert" ON public.razao;
CREATE POLICY "razao_insert" ON public.razao
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "razao_update" ON public.razao;
CREATE POLICY "razao_update" ON public.razao
  FOR UPDATE TO authenticated USING (public.is_admin() OR auth.uid() = user_id) WITH CHECK (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "razao_delete" ON public.razao;
CREATE POLICY "razao_delete" ON public.razao
  FOR DELETE TO authenticated USING (public.is_admin() OR auth.uid() = user_id);

-- plano_contas
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plano_contas_select" ON public.plano_contas;
CREATE POLICY "plano_contas_select" ON public.plano_contas
  FOR SELECT TO authenticated USING (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "plano_contas_insert" ON public.plano_contas;
CREATE POLICY "plano_contas_insert" ON public.plano_contas
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "plano_contas_update" ON public.plano_contas;
CREATE POLICY "plano_contas_update" ON public.plano_contas
  FOR UPDATE TO authenticated USING (public.is_admin() OR auth.uid() = user_id) WITH CHECK (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "plano_contas_delete" ON public.plano_contas;
CREATE POLICY "plano_contas_delete" ON public.plano_contas
  FOR DELETE TO authenticated USING (public.is_admin() OR auth.uid() = user_id);

-- extratos_bancarios
ALTER TABLE public.extratos_bancarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "extratos_bancarios_select" ON public.extratos_bancarios;
CREATE POLICY "extratos_bancarios_select" ON public.extratos_bancarios
  FOR SELECT TO authenticated USING (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "extratos_bancarios_insert" ON public.extratos_bancarios;
CREATE POLICY "extratos_bancarios_insert" ON public.extratos_bancarios
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "extratos_bancarios_update" ON public.extratos_bancarios;
CREATE POLICY "extratos_bancarios_update" ON public.extratos_bancarios
  FOR UPDATE TO authenticated USING (public.is_admin() OR auth.uid() = user_id) WITH CHECK (public.is_admin() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "extratos_bancarios_delete" ON public.extratos_bancarios;
CREATE POLICY "extratos_bancarios_delete" ON public.extratos_bancarios
  FOR DELETE TO authenticated USING (public.is_admin() OR auth.uid() = user_id);

-- =============================================
-- 6. Fix auth.users null token columns
-- =============================================
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL OR recovery_token IS NULL
  OR email_change_token_new IS NULL OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- =============================================
-- 7. Ensure seed user andre@almeida.com.br exists
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

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, full_name, role)
    VALUES (v_user_id, 'Andre Almeida', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Andre Almeida';
  END IF;
END $$;
