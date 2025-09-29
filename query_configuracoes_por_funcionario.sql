-- =====================================================
-- CONSULTAS PARA IDENTIFICAR CONFIGURAÇÕES POR FUNCIONÁRIO
-- =====================================================

-- 1. Ver qual configuração VR/VA foi usada para cada funcionário
SELECT 
    e.nome as funcionario,
    e.cpf,
    fbh.mes_referencia,
    fbh.ano_referencia,
    fbh.benefit_id,
    vvc.tipo as vr_va_tipo,
    vvc.valor_diario,
    vvc.valor_mensal,
    vvc.desconto_por_ausencia,
    vvc.desconto_por_ferias,
    vvc.desconto_por_licenca,
    fbh.valor_beneficio,
    fbh.valor_desconto,
    fbh.valor_final,
    fbh.motivo_desconto
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
LEFT JOIN rh.vr_va_configs vvc ON fbh.vr_va_config_id = vvc.id
WHERE fbh.benefit_id = 'vr-va'
ORDER BY e.nome, fbh.ano_referencia DESC, fbh.mes_referencia DESC;

-- 2. Ver qual configuração de transporte foi usada para cada funcionário
SELECT 
    e.nome as funcionario,
    e.cpf,
    fbh.mes_referencia,
    fbh.ano_referencia,
    fbh.benefit_id,
    tc.tipo as transporte_tipo,
    tc.valor_passagem,
    tc.quantidade_passagens,
    tc.desconto_por_ausencia,
    tc.desconto_por_ferias,
    tc.desconto_por_licenca,
    fbh.valor_beneficio,
    fbh.valor_desconto,
    fbh.valor_final,
    fbh.motivo_desconto
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
LEFT JOIN rh.transporte_configs tc ON fbh.transporte_config_id = tc.id
WHERE fbh.benefit_id = 'transporte'
ORDER BY e.nome, fbh.ano_referencia DESC, fbh.mes_referencia DESC;

-- 3. Ver todas as configurações disponíveis na empresa
SELECT 
    'VR/VA' as tipo_beneficio,
    id,
    tipo,
    valor_diario,
    valor_mensal,
    dias_uteis_mes,
    desconto_por_ausencia,
    desconto_por_ferias,
    desconto_por_licenca,
    is_active,
    created_at
FROM rh.vr_va_configs
WHERE company_id = 'SEU_COMPANY_ID' AND is_active = true

UNION ALL

SELECT 
    'TRANSPORTE' as tipo_beneficio,
    id,
    tipo,
    valor_passagem as valor_diario,
    NULL as valor_mensal,
    NULL as dias_uteis_mes,
    desconto_por_ausencia,
    desconto_por_ferias,
    desconto_por_licenca,
    is_active,
    created_at
FROM rh.transporte_configs
WHERE company_id = 'SEU_COMPANY_ID' AND is_active = true
ORDER BY tipo_beneficio, tipo;

-- 4. Resumo: Quantos funcionários usaram cada configuração
SELECT 
    vvc.tipo as config_vr_va,
    vvc.valor_diario,
    COUNT(DISTINCT fbh.employee_id) as funcionarios_que_usaram,
    COUNT(*) as total_calculos
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.vr_va_configs vvc ON fbh.vr_va_config_id = vvc.id
WHERE fbh.benefit_id = 'vr-va' AND vvc.id IS NOT NULL
GROUP BY vvc.id, vvc.tipo, vvc.valor_diario
ORDER BY funcionarios_que_usaram DESC;

-- 5. Ver histórico completo de um funcionário específico
SELECT 
    e.nome as funcionario,
    fbh.mes_referencia || '/' || fbh.ano_referencia as periodo,
    fbh.benefit_id,
    CASE 
        WHEN fbh.benefit_id = 'vr-va' THEN vvc.tipo
        WHEN fbh.benefit_id = 'transporte' THEN tc.tipo
    END as tipo_config,
    CASE 
        WHEN fbh.benefit_id = 'vr-va' THEN vvc.valor_diario
        WHEN fbh.benefit_id = 'transporte' THEN tc.valor_passagem
    END as valor_config,
    fbh.valor_beneficio,
    fbh.valor_desconto,
    fbh.valor_final,
    fbh.motivo_desconto,
    fbh.created_at
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
LEFT JOIN rh.vr_va_configs vvc ON fbh.vr_va_config_id = vvc.id
LEFT JOIN rh.transporte_configs tc ON fbh.transporte_config_id = tc.id
WHERE e.id = 'ID_DO_FUNCIONARIO'
ORDER BY fbh.ano_referencia DESC, fbh.mes_referencia DESC;
























