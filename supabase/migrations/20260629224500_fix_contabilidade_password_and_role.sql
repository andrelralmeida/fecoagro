-- Fix contabilidade@fecoagro.coop.br password to '123456' and ensure admin role
-- Idempotent: safe to run multiple times

-- 1. Update the password for contabilidade@fecoagro.coop.br
UPDATE auth.users
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email = 'contabilidade@fecoagro.coop.br';

-- 2. Ensure the user exists in auth.users (in case the previous migration didn't run)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'contabilidade@fecoagro.coop.br') THEN
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
      'contabilidade@fecoagro.coop.br',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Contabilidade"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

-- 3. Ensure public.users has the correct role (admin) — use ON CONFLICT DO UPDATE
--    The handle_new_user trigger may have inserted with role='visitante',
--    so we must UPDATE rather than DO NOTHING.
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'contabilidade@fecoagro.coop.br';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, full_name, role)
    VALUES (v_user_id, 'Contabilidade', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Contabilidade';
  END IF;
END $$;

-- 4. Also ensure andre@almeida.com.br has correct password and admin role
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
WHERE email = 'andre@almeida.com.br';

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
