-- Script para adicionar company_id nos metadados do usuário

-- 1. Verificar usuário atual
SELECT 
    id,
    email,
    user_metadata,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'deiverson.medeiros@estrategicengenharia.com.br';

-- 2. Atualizar metadados do usuário com company_id
UPDATE auth.users 
SET 
    user_metadata = COALESCE(user_metadata, '{}'::jsonb) || '{"company_id": "443ce2a2-5718-4a8f-9ec2-70d98e71d7e0"}'::jsonb,
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"company_id": "443ce2a2-5718-4a8f-9ec2-70d98e71d7e0"}'::jsonb
WHERE email = 'deiverson.medeiros@estrategicengenharia.com.br';

-- 3. Verificar se foi atualizado
SELECT 
    id,
    email,
    user_metadata,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'deiverson.medeiros@estrategicengenharia.com.br';

-- 4. Verificar se o usuário tem perfil na tabela profiles
SELECT 
    p.*,
    u.email
FROM core.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'deiverson.medeiros@estrategicengenharia.com.br';

-- 5. Se não tiver perfil, criar um
INSERT INTO core.profiles (
    user_id,
    profile_name,
    name,
    company_id,
    is_active,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'deiverson.medeiros@estrategicengenharia.com.br'),
    'Perfil',
    'Deiverson Honorato',
    '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0',
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    company_id = '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0',
    updated_at = NOW();






























































