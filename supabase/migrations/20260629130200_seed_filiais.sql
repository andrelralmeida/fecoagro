DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andre@almeida.com.br' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.filiais (filial, cnpj, user_id) VALUES
      ('Matriz - Campinas', '12.345.678/0001-90', v_user_id),
      ('Filial - São Paulo', '12.345.678/0002-71', v_user_id),
      ('Filial - Ribeirão Preto', '12.345.678/0003-52', v_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
