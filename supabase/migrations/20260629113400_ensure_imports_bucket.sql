INSERT INTO storage.buckets (id, name, public) VALUES ('imports', 'imports', false) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "imports_select" ON storage.objects;
CREATE POLICY "imports_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'imports');

DROP POLICY IF EXISTS "imports_insert" ON storage.objects;
CREATE POLICY "imports_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imports');

DROP POLICY IF EXISTS "imports_update" ON storage.objects;
CREATE POLICY "imports_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'imports');

DROP POLICY IF EXISTS "imports_delete" ON storage.objects;
CREATE POLICY "imports_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'imports');

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
