-- =====================================================
-- SISTEMA DE VINCULAÇÃO DE FUNCIONÁRIOS A CONFIGURAÇÕES
-- =====================================================

-- Tabela para vincular funcionários a configurações de benefícios
CREATE TABLE IF NOT EXISTS rh.employee_benefit_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    benefit_type VARCHAR(20) NOT NULL CHECK (benefit_type IN ('vr-va', 'transporte')),
    vr_va_config_id UUID REFERENCES rh.vr_va_configs(id) ON DELETE CASCADE,
    transporte_config_id UUID REFERENCES rh.transporte_configs(id) ON DELETE CASCADE,
    
    -- Critérios de aplicação
    criteria_type VARCHAR(50) NOT NULL, -- 'estado', 'cargo', 'sindicato', 'manual'
    criteria_value VARCHAR(100), -- 'BA', 'PE', 'GERENTE', 'SINDICATO_X', etc.
    
    -- Período de vigência
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE, -- NULL = sem data de fim
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT employee_benefit_assignments_benefit_check 
        CHECK (
            (benefit_type = 'vr-va' AND vr_va_config_id IS NOT NULL AND transporte_config_id IS NULL) OR
            (benefit_type = 'transporte' AND transporte_config_id IS NOT NULL AND vr_va_config_id IS NULL)
        ),
    
    -- Evitar duplicatas
    CONSTRAINT employee_benefit_assignments_unique 
        UNIQUE (employee_id, benefit_type, data_inicio)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_employee 
    ON rh.employee_benefit_assignments(employee_id, benefit_type, is_active);

CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_criteria 
    ON rh.employee_benefit_assignments(criteria_type, criteria_value, is_active);

CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_period 
    ON rh.employee_benefit_assignments(data_inicio, data_fim, is_active);

-- Comentários
COMMENT ON TABLE rh.employee_benefit_assignments IS 
'Vincula funcionários a configurações específicas de benefícios baseado em critérios';

COMMENT ON COLUMN rh.employee_benefit_assignments.criteria_type IS 
'Tipo de critério: estado, cargo, sindicato, manual';

COMMENT ON COLUMN rh.employee_benefit_assignments.criteria_value IS 
'Valor do critério: BA, PE, GERENTE, SINDICATO_X, etc.';

-- =====================================================
-- FUNÇÕES PARA GERENCIAR VINCULAÇÕES
-- =====================================================

-- Função para obter configuração ativa de um funcionário
CREATE OR REPLACE FUNCTION rh.get_employee_benefit_config(
    p_employee_id UUID,
    p_benefit_type VARCHAR(20),
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    config_id UUID,
    config_type VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p_benefit_type = 'vr-va' THEN eba.vr_va_config_id
            WHEN p_benefit_type = 'transporte' THEN eba.transporte_config_id
        END as config_id,
        eba.benefit_type as config_type
    FROM rh.employee_benefit_assignments eba
    WHERE eba.employee_id = p_employee_id
        AND eba.benefit_type = p_benefit_type
        AND eba.is_active = true
        AND eba.data_inicio <= p_date
        AND (eba.data_fim IS NULL OR eba.data_fim >= p_date)
    ORDER BY eba.data_inicio DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para vincular funcionário a configuração por critério
CREATE OR REPLACE FUNCTION rh.assign_benefit_by_criteria(
    p_benefit_type VARCHAR(20),
    p_criteria_type VARCHAR(50),
    p_criteria_value VARCHAR(100),
    p_vr_va_config_id UUID DEFAULT NULL,
    p_transporte_config_id UUID DEFAULT NULL,
    p_data_inicio DATE DEFAULT CURRENT_DATE,
    p_data_fim DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_employee_record RECORD;
    v_assigned_count INTEGER := 0;
BEGIN
    -- Validar parâmetros
    IF p_benefit_type NOT IN ('vr-va', 'transporte') THEN
        RAISE EXCEPTION 'Tipo de benefício inválido: %', p_benefit_type;
    END IF;
    
    IF p_benefit_type = 'vr-va' AND p_vr_va_config_id IS NULL THEN
        RAISE EXCEPTION 'vr_va_config_id é obrigatório para benefício vr-va';
    END IF;
    
    IF p_benefit_type = 'transporte' AND p_transporte_config_id IS NULL THEN
        RAISE EXCEPTION 'transporte_config_id é obrigatório para benefício transporte';
    END IF;
    
    -- Buscar funcionários que atendem ao critério
    FOR v_employee_record IN 
        SELECT e.id, e.nome, ea.uf as estado, p.nome as cargo, d.nome as departamento
        FROM rh.employees e
        LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
        LEFT JOIN rh.positions p ON e.position_id = p.id
        LEFT JOIN core.departments d ON e.department_id = d.id
        WHERE e.status = 'ativo'
        AND (
            (p_criteria_type = 'estado' AND ea.uf = p_criteria_value) OR
            (p_criteria_type = 'cargo' AND p.nome = p_criteria_value) OR
            (p_criteria_type = 'departamento' AND d.nome = p_criteria_value) OR
            (p_criteria_type = 'todos' AND TRUE)
        )
    LOOP
        -- Desativar vinculações anteriores
        UPDATE rh.employee_benefit_assignments 
        SET is_active = false, updated_at = now()
        WHERE employee_id = v_employee_record.id 
            AND benefit_type = p_benefit_type
            AND is_active = true;
        
        -- Criar nova vinculação
        INSERT INTO rh.employee_benefit_assignments (
            employee_id,
            benefit_type,
            vr_va_config_id,
            transporte_config_id,
            criteria_type,
            criteria_value,
            data_inicio,
            data_fim
        ) VALUES (
            v_employee_record.id,
            p_benefit_type,
            p_vr_va_config_id,
            p_transporte_config_id,
            p_criteria_type,
            p_criteria_value,
            p_data_inicio,
            p_data_fim
        );
        
        v_assigned_count := v_assigned_count + 1;
    END LOOP;
    
    RETURN v_assigned_count;
END;
$$ LANGUAGE plpgsql;

-- Função para vincular funcionário específico
CREATE OR REPLACE FUNCTION rh.assign_benefit_to_employee(
    p_employee_id UUID,
    p_benefit_type VARCHAR(20),
    p_vr_va_config_id UUID DEFAULT NULL,
    p_transporte_config_id UUID DEFAULT NULL,
    p_data_inicio DATE DEFAULT CURRENT_DATE,
    p_data_fim DATE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar parâmetros
    IF p_benefit_type = 'vr-va' AND p_vr_va_config_id IS NULL THEN
        RAISE EXCEPTION 'vr_va_config_id é obrigatório para benefício vr-va';
    END IF;
    
    IF p_benefit_type = 'transporte' AND p_transporte_config_id IS NULL THEN
        RAISE EXCEPTION 'transporte_config_id é obrigatório para benefício transporte';
    END IF;
    
    -- Desativar vinculações anteriores
    UPDATE rh.employee_benefit_assignments 
    SET is_active = false, updated_at = now()
    WHERE employee_id = p_employee_id 
        AND benefit_type = p_benefit_type
        AND is_active = true;
    
    -- Criar nova vinculação
    INSERT INTO rh.employee_benefit_assignments (
        employee_id,
        benefit_type,
        vr_va_config_id,
        transporte_config_id,
        criteria_type,
        criteria_value,
        data_inicio,
        data_fim
    ) VALUES (
        p_employee_id,
        p_benefit_type,
        p_vr_va_config_id,
        p_transporte_config_id,
        'manual',
        'VINCULACAO_MANUAL',
        p_data_inicio,
        p_data_fim
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXEMPLOS DE USO
-- =====================================================

-- Exemplo 1: Vincular todos os funcionários da Bahia ao VR/VA de R$ 20,00
-- SELECT rh.assign_benefit_by_criteria(
--     'vr-va',
--     'estado',
--     'BA',
--     'ID_DA_CONFIG_VR_20_REAIS',
--     NULL,
--     '2024-01-01'
-- );

-- Exemplo 2: Vincular todos os funcionários de Pernambuco ao VR/VA de R$ 22,00
-- SELECT rh.assign_benefit_by_criteria(
--     'vr-va',
--     'estado',
--     'PE',
--     'ID_DA_CONFIG_VR_22_REAIS',
--     NULL,
--     '2024-01-01'
-- );

-- Exemplo 3: Vincular funcionário específico
-- SELECT rh.assign_benefit_to_employee(
--     'ID_DO_FUNCIONARIO',
--     'vr-va',
--     'ID_DA_CONFIG_ESPECIFICA'
-- );

-- =====================================================
-- CONSULTAS ÚTEIS
-- =====================================================

-- Ver todas as vinculações ativas
CREATE OR REPLACE VIEW rh.vw_employee_benefit_assignments AS
SELECT 
    eba.id,
    e.nome as funcionario,
    e.cpf,
    ea.uf as estado,
    p.nome as cargo,
    d.nome as departamento,
    eba.benefit_type,
    eba.criteria_type,
    eba.criteria_value,
    CASE 
        WHEN eba.benefit_type = 'vr-va' THEN vvc.tipo
        WHEN eba.benefit_type = 'transporte' THEN tc.tipo
    END as config_tipo,
    CASE 
        WHEN eba.benefit_type = 'vr-va' THEN vvc.valor_diario
        WHEN eba.benefit_type = 'transporte' THEN tc.valor_passagem
    END as config_valor,
    eba.data_inicio,
    eba.data_fim,
    eba.is_active
FROM rh.employee_benefit_assignments eba
LEFT JOIN rh.employees e ON eba.employee_id = e.id
LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
LEFT JOIN rh.positions p ON e.position_id = p.id
LEFT JOIN core.departments d ON e.department_id = d.id
LEFT JOIN rh.vr_va_configs vvc ON eba.vr_va_config_id = vvc.id
LEFT JOIN rh.transporte_configs tc ON eba.transporte_config_id = tc.id
WHERE eba.is_active = true
ORDER BY e.nome, eba.benefit_type;

COMMENT ON VIEW rh.vw_employee_benefit_assignments IS 
'Visualização das vinculações ativas de funcionários a configurações de benefícios';
