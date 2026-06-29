-- Ensure RLS is enabled and policies are correct for plano_contas table
-- Idempotent: safe to run even if policies already exist

ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

-- SELECT: users can view their own plano de contas
DROP POLICY IF EXISTS "plano_contas_select" ON public.plano_contas;
CREATE POLICY "plano_contas_select" ON public.plano_contas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT: users can insert their own plano de contas
DROP POLICY IF EXISTS "plano_contas_insert" ON public.plano_contas;
CREATE POLICY "plano_contas_insert" ON public.plano_contas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can update their own plano de contas
DROP POLICY IF EXISTS "plano_contas_update" ON public.plano_contas;
CREATE POLICY "plano_contas_update" ON public.plano_contas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: users can delete their own plano de contas
DROP POLICY IF EXISTS "plano_contas_delete" ON public.plano_contas;
CREATE POLICY "plano_contas_delete" ON public.plano_contas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
