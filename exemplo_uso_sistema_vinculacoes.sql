-- =====================================================
-- EXEMPLO PRÁTICO: SISTEMA DE VINCULAÇÕES
-- Empresa com operações na Bahia (R$ 20,00) e Pernambuco (R$ 22,00)
-- =====================================================

-- PASSO 1: Criar configurações VR/VA para cada estado
-- (Execute estes comandos no Supabase)

-- Configuração VR/VA para Bahia (R$ 20,00/dia)
INSERT INTO rh.vr_va_configs (
    company_id,
    tipo,
    valor_diario,
    valor_mensal,
    dias_uteis_mes,
    desconto_por_ausencia,
    desconto_por_ferias,
    desconto_por_licenca,
    is_active
) VALUES (
    'SEU_COMPANY_ID', -- Substitua pelo ID da sua empresa
    'VR',
    20.00,
    440.00, -- 22 dias * R$ 20,00
    22,
    true,
    true,
    true,
    true
);

-- Configuração VR/VA para Pernambuco (R$ 22,00/dia - acordo sindical)
INSERT INTO rh.vr_va_configs (
    company_id,
    tipo,
    valor_diario,
    valor_mensal,
    dias_uteis_mes,
    desconto_por_ausencia,
    desconto_por_ferias,
    desconto_por_licenca,
    is_active
) VALUES (
    'SEU_COMPANY_ID', -- Substitua pelo ID da sua empresa
    'VR',
    22.00,
    484.00, -- 22 dias * R$ 22,00
    22,
    true,
    true,
    true,
    true
);

-- PASSO 2: Vincular funcionários da Bahia ao VR/VA de R$ 20,00
-- (Substitua 'ID_CONFIG_BA' pelo ID retornado na inserção acima)
SELECT rh.assign_benefit_by_criteria(
    'vr-va',           -- Tipo de benefício
    'estado',          -- Critério: estado
    'BA',              -- Valor: Bahia
    'ID_CONFIG_BA',    -- ID da configuração VR/VA para Bahia
    NULL,              -- Não usado para VR/VA
    '2024-01-01',      -- Data de início
    NULL               -- Sem data de fim
);

-- PASSO 3: Vincular funcionários de Pernambuco ao VR/VA de R$ 22,00
-- (Substitua 'ID_CONFIG_PE' pelo ID retornado na inserção acima)
SELECT rh.assign_benefit_by_criteria(
    'vr-va',           -- Tipo de benefício
    'estado',          -- Critério: estado
    'PE',              -- Valor: Pernambuco
    'ID_CONFIG_PE',    -- ID da configuração VR/VA para Pernambuco
    NULL,              -- Não usado para VR/VA
    '2024-01-01',      -- Data de início
    NULL               -- Sem data de fim
);

-- PASSO 4: Verificar vinculações criadas
SELECT * FROM rh.vw_employee_benefit_assignments
WHERE benefit_type = 'vr-va'
ORDER BY estado, funcionario;

-- PASSO 5: Testar cálculo para funcionário específico
-- (Substitua 'ID_FUNCIONARIO' pelo ID de um funcionário)
SELECT * FROM rh.calculate_vr_va_monthly_value_with_assignment(
    'ID_FUNCIONARIO',  -- ID do funcionário
    'SEU_COMPANY_ID',  -- ID da empresa
    2024,              -- Ano
    12                 -- Dezembro
);

-- PASSO 6: Processar benefícios em lote para dezembro/2024
SELECT rh.process_monthly_benefits_with_assignments(
    'SEU_COMPANY_ID',  -- ID da empresa
    2024,              -- Ano
    12                 -- Dezembro
);

-- PASSO 7: Verificar resultados processados
SELECT 
    e.nome as funcionario,
    e.estado,
    fbh.mes_referencia,
    fbh.ano_referencia,
    vvc.tipo as vr_va_tipo,
    vvc.valor_diario,
    fbh.valor_beneficio,
    fbh.valor_desconto,
    fbh.valor_final,
    fbh.motivo_desconto
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.employees e ON fbh.employee_id = e.id
LEFT JOIN rh.vr_va_configs vvc ON fbh.vr_va_config_id = vvc.id
WHERE fbh.benefit_id = 'vr-va'
    AND fbh.mes_referencia = 12
    AND fbh.ano_referencia = 2024
ORDER BY e.estado, e.nome;

-- =====================================================
-- CENÁRIOS ADICIONAIS
-- =====================================================

-- Cenário 1: Funcionário específico com configuração diferente
-- (Exemplo: Gerente da Bahia que recebe VR premium)
SELECT rh.assign_benefit_to_employee(
    'ID_FUNCIONARIO_ESPECIFICO',
    'vr-va',
    'ID_CONFIG_PREMIUM',
    NULL,
    '2024-01-01'
);

-- Cenário 2: Vincular por cargo
-- (Exemplo: Todos os gerentes recebem VR premium)
SELECT rh.assign_benefit_by_criteria(
    'vr-va',
    'cargo',
    'GERENTE',
    'ID_CONFIG_PREMIUM',
    NULL,
    '2024-01-01'
);

-- Cenário 3: Alterar vinculação com data de fim
-- (Exemplo: Funcionário muda de estado)
UPDATE rh.employee_benefit_assignments 
SET data_fim = '2024-06-30', updated_at = now()
WHERE employee_id = 'ID_FUNCIONARIO'
    AND benefit_type = 'vr-va'
    AND is_active = true;

-- Criar nova vinculação a partir de julho
SELECT rh.assign_benefit_to_employee(
    'ID_FUNCIONARIO',
    'vr-va',
    'ID_CONFIG_NOVO_ESTADO',
    NULL,
    '2024-07-01'
);

-- =====================================================
-- CONSULTAS DE AUDITORIA
-- =====================================================

-- Ver histórico de vinculações de um funcionário
SELECT 
    e.nome as funcionario,
    eba.benefit_type,
    eba.criteria_type,
    eba.criteria_value,
    eba.data_inicio,
    eba.data_fim,
    eba.is_active,
    eba.created_at
FROM rh.employee_benefit_assignments eba
LEFT JOIN rh.employees e ON eba.employee_id = e.id
WHERE e.id = 'ID_FUNCIONARIO'
ORDER BY eba.benefit_type, eba.data_inicio DESC;

-- Ver funcionários sem vinculação
SELECT 
    e.nome,
    e.cpf,
    ea.uf as estado,
    p.nome as cargo
FROM rh.employees e
LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
LEFT JOIN rh.positions p ON e.position_id = p.id
WHERE e.status = 'ativo'
    AND e.id NOT IN (
        SELECT DISTINCT employee_id 
        FROM rh.employee_benefit_assignments 
        WHERE benefit_type = 'vr-va' 
            AND is_active = true
    );

-- Resumo por estado
SELECT 
    ea.uf as estado,
    COUNT(DISTINCT e.id) as total_funcionarios,
    COUNT(DISTINCT eba.employee_id) as funcionarios_com_vinculacao,
    COUNT(DISTINCT eba.vr_va_config_id) as configuracoes_diferentes
FROM rh.employees e
LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
LEFT JOIN rh.employee_benefit_assignments eba ON e.id = eba.employee_id 
    AND eba.benefit_type = 'vr-va' 
    AND eba.is_active = true
WHERE e.status = 'ativo'
GROUP BY ea.uf
ORDER BY ea.uf;
