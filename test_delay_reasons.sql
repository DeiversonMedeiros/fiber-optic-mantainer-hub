-- Teste para verificar se a tabela delay_reasons existe e tem dados
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'delay_reasons'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_records FROM rh.delay_reasons;

-- Verificar alguns registros
SELECT * FROM rh.delay_reasons LIMIT 5;

-- Verificar se há registros com is_active = true
SELECT COUNT(*) as active_records FROM rh.delay_reasons WHERE is_active = true;

-- Verificar company_id específico
SELECT COUNT(*) as company_records FROM rh.delay_reasons 
WHERE company_id = '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0';





























































