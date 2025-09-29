-- =====================================================
-- EXEMPLO COMPLETO: SISTEMA POR ESTADOS
-- Bahia, Pernambuco e São Paulo com valores diferentes
-- =====================================================

-- PASSO 1: Criar configurações VR/VA por estado
INSERT INTO rh.vr_va_configs (company_id, tipo, valor_diario, valor_mensal, dias_uteis_mes, desconto_por_ausencia, desconto_por_ferias, desconto_por_licenca, is_active) VALUES
('SEU_COMPANY_ID', 'VR', 20.00, 440.00, 22, true, true, true, true),    -- Bahia
('SEU_COMPANY_ID', 'VR', 22.00, 484.00, 22, true, true, true, true),    -- Pernambuco (sindicato)
('SEU_COMPANY_ID', 'VR', 25.00, 550.00, 22, true, true, true, true);    -- São Paulo

-- PASSO 2: Criar configurações de transporte por estado
INSERT INTO rh.transporte_configs (company_id, tipo, valor_passagem, quantidade_passagens, desconto_por_ausencia, desconto_por_ferias, desconto_por_licenca, is_active) VALUES
('SEU_COMPANY_ID', 'passagem', 4.50, 2, true, true, true, true),        -- Bahia
('SEU_COMPANY_ID', 'passagem', 5.00, 2, true, true, true, true),        -- Pernambuco
('SEU_COMPANY_ID', 'passagem', 6.00, 2, true, true, true, true);        -- São Paulo

-- PASSO 3: Vincular VR/VA por estado
SELECT rh.assign_benefit_by_criteria('vr-va', 'estado', 'BA', 'ID_CONFIG_VR_BA', NULL, '2024-01-01');
SELECT rh.assign_benefit_by_criteria('vr-va', 'estado', 'PE', 'ID_CONFIG_VR_PE', NULL, '2024-01-01');
SELECT rh.assign_benefit_by_criteria('vr-va', 'estado', 'SP', 'ID_CONFIG_VR_SP', NULL, '2024-01-01');

-- PASSO 4: Vincular transporte por estado
SELECT rh.assign_benefit_by_criteria('transporte', 'estado', 'BA', NULL, 'ID_CONFIG_TRANSPORTE_BA', '2024-01-01');
SELECT rh.assign_benefit_by_criteria('transporte', 'estado', 'PE', NULL, 'ID_CONFIG_TRANSPORTE_PE', '2024-01-01');
SELECT rh.assign_benefit_by_criteria('transporte', 'estado', 'SP', NULL, 'ID_CONFIG_TRANSPORTE_SP', '2024-01-01');

-- PASSO 5: Verificar todas as vinculações
SELECT 
    e.nome as funcionario,
    ea.uf as estado,
    eba.benefit_type,
    CASE 
        WHEN eba.benefit_type = 'vr-va' THEN vvc.tipo || ' - R$ ' || vvc.valor_diario
        WHEN eba.benefit_type = 'transporte' THEN tc.tipo || ' - R$ ' || tc.valor_passagem
    END as configuracao,
    eba.criteria_type,
    eba.criteria_value
FROM rh.employee_benefit_assignments eba
LEFT JOIN rh.employees e ON eba.employee_id = e.id
LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
LEFT JOIN rh.vr_va_configs vvc ON eba.vr_va_config_id = vvc.id
LEFT JOIN rh.transporte_configs tc ON eba.transporte_config_id = tc.id
WHERE eba.is_active = true
ORDER BY ea.uf, e.nome, eba.benefit_type;

-- PASSO 6: Testar cálculo completo para funcionário da Bahia
SELECT 
    'VR/VA' as beneficio,
    * 
FROM rh.calculate_vr_va_monthly_value_with_assignment('ID_FUNCIONARIO_BA', 'SEU_COMPANY_ID', 2024, 12)
UNION ALL
SELECT 
    'TRANSPORTE' as beneficio,
    config_id,
    config_tipo,
    valor_passagem,
    quantidade_passagens,
    dias_uteis_mes,
    dias_feriados,
    dias_ausencia,
    dias_ferias,
    dias_licenca,
    dias_efetivos_trabalho,
    valor_bruto,
    valor_desconto_ausencia,
    valor_desconto_ferias,
    valor_desconto_licenca,
    valor_total_desconto,
    valor_final,
    criteria_type,
    criteria_value
FROM rh.calculate_transporte_monthly_value_with_assignment('ID_FUNCIONARIO_BA', 'SEU_COMPANY_ID', 2024, 12);

-- PASSO 7: Processar benefícios em lote para todos os estados
SELECT rh.process_monthly_benefits_with_assignments('SEU_COMPANY_ID', 2024, 12);

-- PASSO 8: Verificar resultados por estado
SELECT 
    ea.uf as estado,
    COUNT(DISTINCT e.id) as total_funcionarios,
    SUM(CASE WHEN fbh.benefit_id = 'vr-va' THEN fbh.valor_final ELSE 0 END) as total_vr_va,
    SUM(CASE WHEN fbh.benefit_id = 'transporte' THEN fbh.valor_final ELSE 0 END) as total_transporte,
    SUM(fbh.valor_final) as total_beneficios
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
WHERE fbh.mes_referencia = 12 AND fbh.ano_referencia = 2024
GROUP BY ea.uf
ORDER BY ea.uf;

-- =====================================================
-- CENÁRIOS ESPECÍFICOS POR ESTADO
-- =====================================================

-- Cenário 1: Funcionário que muda de estado
-- Desativar vinculação antiga
UPDATE rh.employee_benefit_assignments 
SET data_fim = '2024-06-30', updated_at = now()
WHERE employee_id = 'ID_FUNCIONARIO'
    AND is_active = true;

-- Criar nova vinculação para o novo estado
SELECT rh.assign_benefit_to_employee(
    'ID_FUNCIONARIO',
    'vr-va',
    'ID_CONFIG_VR_NOVO_ESTADO',
    NULL,
    '2024-07-01'
);

SELECT rh.assign_benefit_to_employee(
    'ID_FUNCIONARIO',
    'transporte',
    NULL,
    'ID_CONFIG_TRANSPORTE_NOVO_ESTADO',
    '2024-07-01'
);

-- Cenário 2: Funcionário com configuração específica (exceção)
-- Exemplo: Gerente da Bahia que recebe VR de São Paulo
SELECT rh.assign_benefit_to_employee(
    'ID_GERENTE_BA',
    'vr-va',
    'ID_CONFIG_VR_SP',  -- VR de São Paulo
    NULL,
    '2024-01-01'
);

-- Cenário 3: Verificar funcionários sem vinculação
SELECT 
    e.nome,
    ea.uf as estado,
    p.nome as cargo,
    CASE 
        WHEN eba_vr.employee_id IS NULL THEN 'SEM VR/VA'
        ELSE 'COM VR/VA'
    END as status_vr_va,
    CASE 
        WHEN eba_transp.employee_id IS NULL THEN 'SEM TRANSPORTE'
        ELSE 'COM TRANSPORTE'
    END as status_transporte
FROM rh.employees e
LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
LEFT JOIN rh.positions p ON e.position_id = p.id
LEFT JOIN rh.employee_benefit_assignments eba_vr ON e.id = eba_vr.employee_id 
    AND eba_vr.benefit_type = 'vr-va' 
    AND eba_vr.is_active = true
LEFT JOIN rh.employee_benefit_assignments eba_transp ON e.id = eba_transp.employee_id 
    AND eba_transp.benefit_type = 'transporte' 
    AND eba_transp.is_active = true
WHERE e.status = 'ativo'
ORDER BY ea.uf, e.nome;

-- =====================================================
-- RELATÓRIO CONSOLIDADO POR ESTADO
-- =====================================================

-- Relatório completo de benefícios por estado
SELECT 
    ea.uf as estado,
    COUNT(DISTINCT e.id) as funcionarios_ativos,
    COUNT(DISTINCT eba_vr.employee_id) as funcionarios_com_vr_va,
    COUNT(DISTINCT eba_transp.employee_id) as funcionarios_com_transporte,
    AVG(vvc.valor_diario) as valor_medio_vr_va,
    AVG(tc.valor_passagem) as valor_medio_transporte
FROM rh.employees e
LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
LEFT JOIN rh.employee_benefit_assignments eba_vr ON e.id = eba_vr.employee_id 
    AND eba_vr.benefit_type = 'vr-va' 
    AND eba_vr.is_active = true
LEFT JOIN rh.employee_benefit_assignments eba_transp ON e.id = eba_transp.employee_id 
    AND eba_transp.benefit_type = 'transporte' 
    AND eba_transp.is_active = true
LEFT JOIN rh.vr_va_configs vvc ON eba_vr.vr_va_config_id = vvc.id
LEFT JOIN rh.transporte_configs tc ON eba_transp.transporte_config_id = tc.id
WHERE e.status = 'ativo'
GROUP BY ea.uf
ORDER BY ea.uf;
