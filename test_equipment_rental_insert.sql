-- Script para testar inserção de dados na tabela equipment_rentals
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se existem funcionários na tabela employees
SELECT 
    COUNT(*) as total_employees,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees
FROM rh.employees;

-- 2. Verificar funcionários ativos
SELECT 
    id,
    name,
    cpf,
    status,
    company_id
FROM rh.employees 
WHERE status = 'active'
LIMIT 5;

-- 3. Verificar funcionários da empresa específica
SELECT 
    id,
    name,
    cpf,
    status,
    company_id
FROM rh.employees 
WHERE company_id = '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'::uuid
AND status = 'active'
LIMIT 5;

-- 4. Inserir funcionário de teste se não existir
INSERT INTO rh.employees (
    id,
    company_id,
    name,
    cpf,
    email,
    phone,
    status,
    created_at,
    updated_at,
    created_by
) VALUES (
    gen_random_uuid(),
    '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'::uuid,
    'Funcionário Teste',
    '12345678901',
    'teste@empresa.com',
    '11999999999',
    'active',
    NOW(),
    NOW(),
    auth.uid()
) ON CONFLICT (cpf, company_id) DO NOTHING;

-- 5. Verificar se o funcionário foi inserido
SELECT 
    id,
    name,
    cpf,
    status,
    company_id
FROM rh.employees 
WHERE company_id = '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'::uuid
AND status = 'active'
LIMIT 5;

-- 6. Inserir equipamento de teste
INSERT INTO rh.equipment_rentals (
    company_id,
    employee_id,
    equipment_type,
    equipment_name,
    monthly_value,
    start_date,
    status,
    created_by
) VALUES (
    '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'::uuid,
    (SELECT id FROM rh.employees WHERE company_id = '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'::uuid AND status = 'active' LIMIT 1),
    'computer',
    'Notebook Teste',
    500.00,
    CURRENT_DATE,
    'active',
    auth.uid()
);

-- 7. Verificar se o equipamento foi inserido
SELECT 
    id,
    equipment_name,
    equipment_type,
    monthly_value,
    status,
    employee_id
FROM rh.equipment_rentals;

-- 8. Inserir pagamento de teste
INSERT INTO rh.equipment_rental_payments (
    company_id,
    equipment_rental_id,
    payment_month,
    payment_year,
    amount,
    status,
    created_by
) VALUES (
    '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'::uuid,
    (SELECT id FROM rh.equipment_rentals LIMIT 1),
    '2025-09',
    2025,
    500.00,
    'pending',
    auth.uid()
);

-- 9. Verificar se o pagamento foi inserido
SELECT 
    id,
    payment_month,
    payment_year,
    amount,
    status,
    equipment_rental_id
FROM rh.equipment_rental_payments;

