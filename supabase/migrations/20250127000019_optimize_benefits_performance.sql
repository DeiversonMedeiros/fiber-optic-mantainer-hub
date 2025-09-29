-- =====================================================
-- OTIMIZAÇÃO DE PERFORMANCE PARA SISTEMA UNIFICADO DE BENEFÍCIOS
-- =====================================================

-- =====================================================
-- 1. ÍNDICES PARA BENEFIT_CONFIGURATIONS
-- =====================================================

-- Índice para busca por empresa e tipo de benefício
CREATE INDEX IF NOT EXISTS idx_benefit_configurations_company_type 
ON rh.benefit_configurations (company_id, benefit_type);

-- Índice para busca por empresa e status ativo
CREATE INDEX IF NOT EXISTS idx_benefit_configurations_company_active 
ON rh.benefit_configurations (company_id, is_active);

-- Índice para busca por tipo de cálculo
CREATE INDEX IF NOT EXISTS idx_benefit_configurations_calculation_type 
ON rh.benefit_configurations (calculation_type);

-- =====================================================
-- 2. ÍNDICES PARA EMPLOYEE_BENEFIT_ASSIGNMENTS
-- =====================================================

-- Índice para busca por funcionário
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_employee 
ON rh.employee_benefit_assignments (employee_id);

-- Índice para busca por empresa e funcionário
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_company_employee 
ON rh.employee_benefit_assignments (company_id, employee_id);

-- Índice para busca por tipo de benefício
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_benefit_type 
ON rh.employee_benefit_assignments (benefit_type);

-- Índice para busca por período de vigência
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_period 
ON rh.employee_benefit_assignments (start_date, end_date);

-- Índice para busca por configuração de benefício
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_config 
ON rh.employee_benefit_assignments (benefit_config_id) 
WHERE benefit_config_id IS NOT NULL;

-- Índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_company_type_period 
ON rh.employee_benefit_assignments (company_id, benefit_type, start_date, end_date);

-- =====================================================
-- 3. ÍNDICES PARA MONTHLY_BENEFIT_PROCESSING
-- =====================================================

-- Índice para busca por período
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_period 
ON rh.monthly_benefit_processing (month_reference, year_reference);

-- Índice para busca por empresa e período
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_company_period 
ON rh.monthly_benefit_processing (company_id, month_reference, year_reference);

-- Índice para busca por funcionário
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_employee 
ON rh.monthly_benefit_processing (employee_id);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_status 
ON rh.monthly_benefit_processing (status);

-- Índice para busca por configuração de benefício
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_config 
ON rh.monthly_benefit_processing (benefit_config_id);

-- Índice composto para consultas de relatórios
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_report 
ON rh.monthly_benefit_processing (company_id, month_reference, year_reference, status, benefit_config_id);

-- =====================================================
-- 4. ÍNDICES PARA BENEFIT_PAYMENTS
-- =====================================================

-- Índice para busca por período
CREATE INDEX IF NOT EXISTS idx_benefit_payments_period 
ON rh.benefit_payments (created_at);

-- Índice para busca por empresa
CREATE INDEX IF NOT EXISTS idx_benefit_payments_company 
ON rh.benefit_payments (company_id);

-- Índice para busca por status de pagamento
CREATE INDEX IF NOT EXISTS idx_benefit_payments_status 
ON rh.benefit_payments (payment_status);

-- Índice para busca por método de pagamento
CREATE INDEX IF NOT EXISTS idx_benefit_payments_method 
ON rh.benefit_payments (payment_method);

-- Índice para busca por funcionário
CREATE INDEX IF NOT EXISTS idx_benefit_payments_employee 
ON rh.benefit_payments (employee_id);

-- Índice composto para consultas de pagamentos
CREATE INDEX IF NOT EXISTS idx_benefit_payments_company_status 
ON rh.benefit_payments (company_id, payment_status, created_at);

-- =====================================================
-- 5. ÍNDICES PARA TABELAS RELACIONADAS
-- =====================================================

-- Índice para employees por empresa (se não existir)
CREATE INDEX IF NOT EXISTS idx_employees_company 
ON rh.employees (company_id);

-- Índice para employees por status (se não existir)
CREATE INDEX IF NOT EXISTS idx_employees_status 
ON rh.employees (status);

-- =====================================================
-- 6. ÍNDICES PARA CONSULTAS DE ESTATÍSTICAS
-- =====================================================

-- Índice parcial para benefícios ativos
CREATE INDEX IF NOT EXISTS idx_benefit_configurations_active 
ON rh.benefit_configurations (company_id, benefit_type) 
WHERE is_active = true;

-- Índice parcial para vínculos ativos
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_active 
ON rh.employee_benefit_assignments (company_id, employee_id, benefit_type) 
WHERE end_date IS NULL;

-- Índice parcial para pagamentos pendentes
CREATE INDEX IF NOT EXISTS idx_benefit_payments_pending 
ON rh.benefit_payments (company_id, payment_status) 
WHERE payment_status = 'pending';

-- =====================================================
-- 7. OTIMIZAÇÃO DE CONFIGURAÇÕES
-- =====================================================

-- Configurar estatísticas mais detalhadas para tabelas grandes
-- (Configurações de estatísticas podem ser ajustadas conforme necessário)

-- =====================================================
-- 8. COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON INDEX idx_benefit_configurations_company_type IS 'Otimiza consultas por empresa e tipo de benefício';
COMMENT ON INDEX idx_employee_benefit_assignments_company_employee IS 'Otimiza consultas de vínculos por empresa e funcionário';
COMMENT ON INDEX idx_monthly_benefit_processing_company_period IS 'Otimiza consultas de processamento por empresa e período';
COMMENT ON INDEX idx_benefit_payments_company_status IS 'Otimiza consultas de pagamentos por empresa e status';

-- =====================================================
-- 9. VERIFICAÇÃO DE PERFORMANCE
-- =====================================================

-- Função para verificar se os índices foram criados corretamente
CREATE OR REPLACE FUNCTION rh.check_benefits_indexes()
RETURNS TABLE (
    index_name text,
    table_name text,
    index_definition text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexname::text,
        t.tablename::text,
        pg_get_indexdef(i.indexrelid)::text
    FROM pg_indexes i
    JOIN pg_tables t ON i.tablename = t.tablename
    WHERE i.schemaname = 'rh' 
    AND i.tablename IN (
        'benefit_configurations',
        'employee_benefit_assignments', 
        'monthly_benefit_processing',
        'benefit_payments'
    )
    ORDER BY t.tablename, i.indexname;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. LOG DE OTIMIZAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Otimização de performance concluída com sucesso!';
    RAISE NOTICE 'Índices criados para melhorar performance das consultas de benefícios.';
    RAISE NOTICE 'Use a função rh.check_benefits_indexes() para verificar os índices criados.';
END $$;
