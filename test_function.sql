-- Testar se a função calculate_employee_work_days existe e funciona
SELECT 
    proname as function_name,
    pronargs as argument_count,
    proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname = 'calculate_employee_work_days' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'rh');
