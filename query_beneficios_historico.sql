-- =====================================================
-- CONSULTAS PARA VERIFICAR DADOS DAS ABAS
-- =====================================================

-- 1. Ver todos os benefícios calculados (Calculadora Dinâmica + Processamento em Lote)
SELECT 
    fbh.*,
    e.nome as funcionario_nome,
    e.cpf as funcionario_cpf,
    vvc.tipo as vr_va_tipo,
    vvc.valor_diario as vr_va_valor_diario,
    tc.tipo as transporte_tipo,
    tc.valor_passagem as transporte_valor_passagem
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
LEFT JOIN rh.vr_va_configs vvc ON fbh.vr_va_config_id = vvc.id
LEFT JOIN rh.transporte_configs tc ON fbh.transporte_config_id = tc.id
ORDER BY fbh.ano_referencia DESC, fbh.mes_referencia DESC, e.nome;

-- 2. Ver apenas cálculos da Calculadora Dinâmica (inserções manuais)
SELECT 
    fbh.*,
    e.nome as funcionario_nome,
    'Calculadora Dinâmica' as origem
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
WHERE fbh.created_at > NOW() - INTERVAL '1 day' -- Últimas 24 horas
ORDER BY fbh.created_at DESC;

-- 3. Ver apenas processamentos em lote
SELECT 
    fbh.*,
    e.nome as funcionario_nome,
    'Processamento em Lote' as origem
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
WHERE fbh.mes_referencia = 12 AND fbh.ano_referencia = 2024 -- Exemplo: dezembro/2024
ORDER BY e.nome;

-- 4. Resumo por funcionário e mês
SELECT 
    e.nome as funcionario,
    fbh.mes_referencia,
    fbh.ano_referencia,
    SUM(CASE WHEN fbh.benefit_id = 'vr-va' THEN fbh.valor_final ELSE 0 END) as total_vr_va,
    SUM(CASE WHEN fbh.benefit_id = 'transporte' THEN fbh.valor_final ELSE 0 END) as total_transporte,
    SUM(fbh.valor_final) as total_beneficios
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
WHERE fbh.status = 'ativo'
GROUP BY e.id, e.nome, fbh.mes_referencia, fbh.ano_referencia
ORDER BY fbh.ano_referencia DESC, fbh.mes_referencia DESC, e.nome;

-- 5. Ver configurações usadas nos cálculos
SELECT DISTINCT
    fbh.benefit_id,
    vvc.tipo as vr_va_tipo,
    vvc.valor_diario as vr_va_valor_diario,
    tc.tipo as transporte_tipo,
    tc.valor_passagem as transporte_valor_passagem
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.vr_va_configs vvc ON fbh.vr_va_config_id = vvc.id
LEFT JOIN rh.transporte_configs tc ON fbh.transporte_config_id = tc.id
WHERE fbh.status = 'ativo';

-- 6. Contar registros por origem (estimativa)
SELECT 
    CASE 
        WHEN created_at = updated_at THEN 'Processamento em Lote'
        ELSE 'Calculadora Dinâmica'
    END as origem,
    COUNT(*) as total_registros,
    COUNT(DISTINCT employee_id) as funcionarios_unicos
FROM rh.funcionario_beneficios_historico
WHERE status = 'ativo'
GROUP BY (created_at = updated_at);
























