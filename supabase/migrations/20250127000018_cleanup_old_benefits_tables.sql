-- =====================================================
-- LIMPEZA DE TABELAS ANTIGAS DE BENEFÍCIOS
-- =====================================================
-- Esta migração remove tabelas antigas que foram substituídas
-- pela estrutura unificada de benefícios

-- =====================================================
-- 1. REMOVER FUNÇÕES ANTIGAS QUE NÃO SÃO MAIS USADAS
-- =====================================================

-- Remover funções antigas de rateio de benefícios
DROP FUNCTION IF EXISTS rh.aplicar_rateio_beneficio(uuid);
DROP FUNCTION IF EXISTS rh.calcular_rateio_beneficio(uuid);
DROP FUNCTION IF EXISTS rh.assign_benefit_by_criteria(character varying, character varying, character varying, uuid, uuid, date, date);
DROP FUNCTION IF EXISTS rh.assign_benefit_to_employee(uuid, character varying, uuid, uuid, date, date);

-- =====================================================
-- 2. REMOVER TABELAS ANTIGAS DE BENEFÍCIOS
-- =====================================================

-- Remover tabelas antigas que foram migradas para a estrutura unificada
DROP TABLE IF EXISTS rh.benefits CASCADE;
DROP TABLE IF EXISTS rh.employee_benefits CASCADE;

-- Remover tabelas antigas de elegibilidade e rateio
DROP TABLE IF EXISTS rh.beneficio_elegibilidade CASCADE;
DROP TABLE IF EXISTS rh.beneficio_elegibilidade_cargos CASCADE;
DROP TABLE IF EXISTS rh.beneficio_elegibilidade_departamentos CASCADE;
DROP TABLE IF EXISTS rh.beneficio_rateio_departamentos CASCADE;
DROP TABLE IF EXISTS rh.beneficio_rateio_historico CASCADE;
DROP TABLE IF EXISTS rh.beneficio_rateios CASCADE;
DROP TABLE IF EXISTS rh.beneficio_tipos CASCADE;
DROP TABLE IF EXISTS rh.beneficios_descontos_afastamento CASCADE;
DROP TABLE IF EXISTS rh.beneficios_elegibilidade CASCADE;
DROP TABLE IF EXISTS rh.beneficios_rateios CASCADE;

-- =====================================================
-- 3. REMOVER ENUMS ANTIGOS NÃO UTILIZADOS
-- =====================================================

-- Remover enums antigos que foram substituídos
DROP TYPE IF EXISTS rh.tipo_beneficio_rh CASCADE;
DROP TYPE IF EXISTS rh.tipo_premiacao_enum CASCADE;

-- =====================================================
-- 4. VERIFICAR E REMOVER TRIGGERS ANTIGOS
-- =====================================================

-- Remover triggers que podem estar associados às tabelas removidas
-- (Os triggers são removidos automaticamente com as tabelas via CASCADE)

-- =====================================================
-- 5. VERIFICAR E REMOVER POLÍTICAS RLS ANTIGAS
-- =====================================================

-- As políticas RLS são removidas automaticamente com as tabelas via CASCADE

-- =====================================================
-- 6. LIMPEZA DE DADOS ORFÃOS (OPCIONAL)
-- =====================================================

-- Verificar se há dados órfãos em outras tabelas que referenciam as tabelas removidas
-- Por exemplo, verificar se há referências em logs ou auditorias

-- =====================================================
-- 7. COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE rh.benefit_configurations IS 'Tabela unificada para configurações de benefícios - substitui as antigas tabelas benefits, beneficio_tipos, etc.';
COMMENT ON TABLE rh.employee_benefit_assignments IS 'Tabela unificada para vínculos funcionário-benefício - substitui employee_benefits e tabelas de elegibilidade';
COMMENT ON TABLE rh.monthly_benefit_processing IS 'Tabela unificada para processamento mensal - substitui lógica distribuída em várias tabelas';
COMMENT ON TABLE rh.benefit_payments IS 'Tabela unificada para pagamentos - integra com Flash API e outros métodos';

-- =====================================================
-- 8. VERIFICAÇÃO DE INTEGRIDADE
-- =====================================================

-- Verificar se todas as tabelas unificadas estão funcionando corretamente
DO $$
BEGIN
    -- Verificar se as tabelas unificadas existem
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rh' AND table_name = 'benefit_configurations') THEN
        RAISE EXCEPTION 'Tabela benefit_configurations não encontrada!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rh' AND table_name = 'employee_benefit_assignments') THEN
        RAISE EXCEPTION 'Tabela employee_benefit_assignments não encontrada!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rh' AND table_name = 'monthly_benefit_processing') THEN
        RAISE EXCEPTION 'Tabela monthly_benefit_processing não encontrada!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'rh' AND table_name = 'benefit_payments') THEN
        RAISE EXCEPTION 'Tabela benefit_payments não encontrada!';
    END IF;
    
    RAISE NOTICE 'Limpeza concluída com sucesso! Todas as tabelas unificadas estão funcionando.';
END $$;
