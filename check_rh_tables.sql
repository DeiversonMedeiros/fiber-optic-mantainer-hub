-- Script para verificar se as tabelas do schema rh existem
-- Execute este script no Supabase SQL Editor para diagnosticar

-- Verificar se o schema rh existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'rh') 
        THEN 'Schema RH existe' 
        ELSE 'Schema RH NÃO existe' 
    END as schema_status;

-- Verificar tabelas no schema rh
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'rh' 
ORDER BY table_name;

-- Verificar se a tabela employees existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rh' AND table_name = 'employees') 
        THEN 'Tabela rh.employees existe' 
        ELSE 'Tabela rh.employees NÃO existe' 
    END as employees_status;

-- Verificar se a tabela equipment_rentals existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rh' AND table_name = 'equipment_rentals') 
        THEN 'Tabela rh.equipment_rentals existe' 
        ELSE 'Tabela rh.equipment_rentals NÃO existe' 
    END as equipment_rentals_status;

-- Verificar se a tabela equipment_rental_payments existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rh' AND table_name = 'equipment_rental_payments') 
        THEN 'Tabela rh.equipment_rental_payments existe' 
        ELSE 'Tabela rh.equipment_rental_payments NÃO existe' 
    END as equipment_rental_payments_status;

