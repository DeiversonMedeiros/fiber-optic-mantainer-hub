-- Script para verificar se todos os campos foram adicionados corretamente na tabela employees

-- Verificar estrutura atual da tabela employees
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'employees' 
ORDER BY ordinal_position;

-- Verificar especificamente os novos campos
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'employees' 
AND column_name IN (
    'precisa_registrar_ponto', 
    'tipo_banco_horas', 
    'is_pcd', 
    'deficiency_type', 
    'deficiency_degree', 
    'periculosidade', 
    'insalubridade'
)
ORDER BY column_name;

-- Verificar constraints
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'rh' 
AND tc.table_name = 'employees'
AND tc.constraint_type = 'CHECK';

-- Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'rh' 
AND tablename = 'employees'
AND indexname LIKE 'idx_employees_%'
ORDER BY indexname;



























