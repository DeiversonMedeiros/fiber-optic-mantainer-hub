-- Script para testar se os dados estão na tabela delay_reasons

-- 1. Verificar se a tabela existe
SELECT 
    table_name, 
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'rh' 
AND table_name = 'delay_reasons';

-- 2. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'delay_reasons'
ORDER BY ordinal_position;

-- 3. Contar total de registros
SELECT COUNT(*) as total_records FROM rh.delay_reasons;

-- 4. Verificar registros ativos
SELECT COUNT(*) as active_records FROM rh.delay_reasons WHERE is_active = true;

-- 5. Verificar registros por company_id
SELECT 
    company_id, 
    COUNT(*) as count_by_company
FROM rh.delay_reasons 
GROUP BY company_id;

-- 6. Verificar registros específicos
SELECT 
    id,
    codigo,
    descricao,
    categoria,
    is_active,
    company_id,
    created_at
FROM rh.delay_reasons 
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar se há registros com o company_id específico
SELECT COUNT(*) as specific_company_records 
FROM rh.delay_reasons 
WHERE company_id = '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0';

-- 8. Verificar registros ativos com company_id específico
SELECT COUNT(*) as active_specific_company_records 
FROM rh.delay_reasons 
WHERE company_id = '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0' 
AND is_active = true;





























































