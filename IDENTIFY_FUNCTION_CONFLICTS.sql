-- =====================================================
-- SCRIPT PARA IDENTIFICAR CONFLITOS DE FUNÇÕES
-- =====================================================

-- 1. Buscar todas as funções com nome 'get_employees'
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition,
    p.prosrc as source_code,
    p.prokind as function_type,
    CASE 
        WHEN p.prokind = 'f' THEN 'FUNCTION'
        WHEN p.prokind = 'p' THEN 'PROCEDURE'
        WHEN p.prokind = 'a' THEN 'AGGREGATE'
        WHEN p.prokind = 'w' THEN 'WINDOW'
    END as type_description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_employees'
ORDER BY n.nspname, p.proname;

-- 2. Buscar todas as funções que começam com 'get_'
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.prokind = 'f' THEN 'FUNCTION'
        WHEN p.prokind = 'p' THEN 'PROCEDURE'
        WHEN p.prokind = 'a' THEN 'AGGREGATE'
        WHEN p.prokind = 'w' THEN 'WINDOW'
    END as type_description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE 'get_%'
ORDER BY n.nspname, p.proname;

-- 3. Buscar todas as funções no schema 'public' que começam com 'get_'
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname LIKE 'get_%'
ORDER BY p.proname;

-- 4. Verificar se existem funções com nomes similares
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%employee%' OR p.proname LIKE '%periodic%'
ORDER BY n.nspname, p.proname;

-- 5. Verificar permissões das funções existentes
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    p.proacl as permissions,
    r.rolname as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON p.proowner = r.oid
WHERE p.proname = 'get_employees'
ORDER BY n.nspname, p.proname;

-- 6. Buscar dependências da função existente
SELECT 
    d.objid::regproc as dependent_function,
    d.refobjid::regproc as referenced_function,
    d.deptype as dependency_type
FROM pg_depend d
JOIN pg_proc p ON d.objid = p.oid
WHERE p.proname = 'get_employees';

-- 7. Verificar se a função é usada em triggers, views ou outras estruturas
SELECT 
    'TRIGGER' as object_type,
    t.tgname as object_name,
    c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgfoid IN (
    SELECT p.oid FROM pg_proc p WHERE p.proname = 'get_employees'
)
UNION ALL
SELECT 
    'VIEW' as object_type,
    c.relname as object_name,
    '' as table_name
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relkind = 'v' 
AND n.nspname = 'public'
AND c.relname LIKE '%employee%';

-- 8. Listar todas as funções no schema 'public' para comparação
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.prokind = 'f' THEN 'FUNCTION'
        WHEN p.prokind = 'p' THEN 'PROCEDURE'
        WHEN p.prokind = 'a' THEN 'AGGREGATE'
        WHEN p.prokind = 'w' THEN 'WINDOW'
    END as type_description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
