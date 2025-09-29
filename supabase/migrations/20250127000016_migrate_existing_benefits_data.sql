-- =====================================================
-- MIGRAÇÃO: MIGRAR DADOS EXISTENTES PARA ESTRUTURA UNIFICADA
-- =====================================================
-- Esta migração migra os dados das tabelas antigas para a nova estrutura unificada

-- 1. MIGRAR CONFIGURAÇÕES DE BENEFÍCIOS
-- =====================================================

-- Migrar dados da tabela rh.benefits para rh.benefit_configurations
INSERT INTO rh.benefit_configurations (
    company_id,
    benefit_type,
    name,
    description,
    calculation_type,
    base_value,
    percentage_value,
    is_active,
    created_at,
    updated_at,
    flash_category
)
SELECT 
    company_id,
    CASE 
        WHEN LOWER(nome) LIKE '%vr%' OR LOWER(nome) LIKE '%va%' THEN 'vr_va'::rh.benefit_type_enum
        WHEN LOWER(nome) LIKE '%transporte%' OR LOWER(nome) LIKE '%vale%' THEN 'transporte'::rh.benefit_type_enum
        WHEN LOWER(nome) LIKE '%equipamento%' OR LOWER(nome) LIKE '%locação%' THEN 'equipment_rental'::rh.benefit_type_enum
        WHEN LOWER(nome) LIKE '%premiação%' OR LOWER(nome) LIKE '%produtividade%' THEN 'premiacao'::rh.benefit_type_enum
        ELSE 'vr_va'::rh.benefit_type_enum -- Default para VR/VA
    END as benefit_type,
    nome as name,
    NULL as description,
    CASE 
        WHEN valor IS NOT NULL AND percentual IS NULL THEN 'fixed_value'::rh.calculation_type_enum
        WHEN percentual IS NOT NULL AND valor IS NULL THEN 'percentage'::rh.calculation_type_enum
        WHEN valor IS NOT NULL AND percentual IS NOT NULL THEN 'fixed_value'::rh.calculation_type_enum
        ELSE 'fixed_value'::rh.calculation_type_enum
    END as calculation_type,
    COALESCE(valor, 0) as base_value,
    percentual as percentage_value,
    is_active,
    created_at,
    created_at as updated_at,
    CASE 
        WHEN LOWER(nome) LIKE '%vr%' OR LOWER(nome) LIKE '%va%' THEN 'REFEICAO E ALIMENTACAO'
        WHEN LOWER(nome) LIKE '%transporte%' OR LOWER(nome) LIKE '%vale%' THEN 'VALE TRANSPORTE PIX'
        WHEN LOWER(nome) LIKE '%equipamento%' OR LOWER(nome) LIKE '%locação%' THEN 'PREMIACAO VIRTUAL'
        WHEN LOWER(nome) LIKE '%premiação%' OR LOWER(nome) LIKE '%produtividade%' THEN 'PREMIACAO VIRTUAL'
        ELSE 'REFEICAO E ALIMENTACAO'
    END as flash_category
FROM rh.benefits
WHERE NOT EXISTS (
    SELECT 1 FROM rh.benefit_configurations bc 
    WHERE bc.company_id = benefits.company_id 
    AND bc.name = benefits.nome
);

-- 2. MIGRAR VÍNCULOS DE FUNCIONÁRIOS
-- =====================================================

-- Migrar dados da tabela rh.employee_benefits para rh.employee_benefit_assignments
INSERT INTO rh.employee_benefit_assignments (
    employee_id,
    benefit_config_id,
    company_id,
    benefit_type,
    vr_va_config_id,
    transporte_config_id,
    criteria_type,
    start_date,
    end_date,
    is_active,
    created_at,
    updated_at
)
SELECT 
    eb.employee_id,
    bc.id as benefit_config_id,
    eb.company_id,
    CASE 
        WHEN bc.benefit_type = 'vr_va' THEN 'vr-va'::character varying
        WHEN bc.benefit_type = 'transporte' THEN 'transporte'::character varying
        ELSE 'vr-va'::character varying
    END as benefit_type,
    CASE 
        WHEN bc.benefit_type = 'vr_va' THEN bc.id
        ELSE NULL
    END as vr_va_config_id,
    CASE 
        WHEN bc.benefit_type = 'transporte' THEN bc.id
        ELSE NULL
    END as transporte_config_id,
    'geral'::character varying as criteria_type,
    COALESCE(eb.data_inicio, CURRENT_DATE) as start_date,
    eb.data_fim as end_date,
    eb.is_active,
    eb.created_at,
    eb.created_at as updated_at
FROM rh.employee_benefits eb
JOIN rh.benefit_configurations bc ON (
    bc.company_id = eb.company_id 
    AND bc.benefit_type = CASE 
        WHEN eb.benefit_id IN (
            SELECT id FROM rh.benefits WHERE LOWER(nome) LIKE '%vr%' OR LOWER(nome) LIKE '%va%'
        ) THEN 'vr_va'::rh.benefit_type_enum
        WHEN eb.benefit_id IN (
            SELECT id FROM rh.benefits WHERE LOWER(nome) LIKE '%transporte%' OR LOWER(nome) LIKE '%vale%'
        ) THEN 'transporte'::rh.benefit_type_enum
        WHEN eb.benefit_id IN (
            SELECT id FROM rh.benefits WHERE LOWER(nome) LIKE '%equipamento%' OR LOWER(nome) LIKE '%locação%'
        ) THEN 'equipment_rental'::rh.benefit_type_enum
        WHEN eb.benefit_id IN (
            SELECT id FROM rh.benefits WHERE LOWER(nome) LIKE '%premiação%' OR LOWER(nome) LIKE '%produtividade%'
        ) THEN 'premiacao'::rh.benefit_type_enum
        ELSE 'vr_va'::rh.benefit_type_enum
    END
)
WHERE NOT EXISTS (
    SELECT 1 FROM rh.employee_benefit_assignments eba 
    WHERE eba.employee_id = eb.employee_id 
    AND eba.benefit_config_id = bc.id
    AND eba.start_date = COALESCE(eb.data_inicio, CURRENT_DATE)
);

-- 3. MIGRAR DADOS DE LOCAÇÃO DE EQUIPAMENTOS
-- =====================================================
-- NOTA: Esta seção foi comentada temporariamente devido a complexidades com as constraints
-- dos equipamentos. Será implementada em uma migração futura.

-- 4. MIGRAR DADOS DE PREMIAÇÃO
-- =====================================================

-- Migrar configurações de premiação existentes
INSERT INTO rh.benefit_configurations (
    company_id,
    benefit_type,
    name,
    description,
    calculation_type,
    base_value,
    min_value,
    max_value,
    production_percentage,
    is_active,
    created_at,
    updated_at,
    flash_category
)
SELECT 
    pc.company_id,
    'premiacao'::rh.benefit_type_enum,
    pc.nome as name,
    pc.descricao as description,
    CASE 
        WHEN pc.tipo_premiacao = 'fixa' THEN 'fixed_value'::rh.calculation_type_enum
        WHEN pc.tipo_premiacao = 'variavel' THEN 'fixed_value'::rh.calculation_type_enum -- Usar fixed_value com min/max
        WHEN pc.tipo_premiacao = 'por_producao' THEN 'production_based'::rh.calculation_type_enum
        WHEN pc.tipo_premiacao = 'por_meta' THEN 'goal_based'::rh.calculation_type_enum
        ELSE 'fixed_value'::rh.calculation_type_enum
    END as calculation_type,
    pc.valor_base as base_value,
    pc.meta_minima as min_value,
    pc.meta_maxima as max_value,
    pc.percentual_producao as production_percentage,
    pc.is_active,
    pc.created_at,
    pc.updated_at,
    'PREMIACAO VIRTUAL' as flash_category
FROM rh.premiacao_configs pc
WHERE NOT EXISTS (
    SELECT 1 FROM rh.benefit_configurations bc 
    WHERE bc.company_id = pc.company_id 
    AND bc.benefit_type = 'premiacao'
    AND bc.name = pc.nome
);

-- Migrar atribuições de premiação
INSERT INTO rh.employee_benefit_assignments (
    employee_id,
    benefit_config_id,
    company_id,
    benefit_type,
    vr_va_config_id,
    transporte_config_id,
    criteria_type,
    start_date,
    end_date,
    is_active,
    created_at,
    updated_at
)
SELECT 
    pa.employee_id,
    bc.id as benefit_config_id,
    pa.company_id,
    'vr-va'::character varying as benefit_type, -- Default para premiação
    bc.id as vr_va_config_id, -- Usar o ID da configuração para premiação
    NULL as transporte_config_id,
    'premiacao'::character varying as criteria_type,
    CURRENT_DATE as start_date,
    NULL as end_date,
    pa.is_active,
    pa.created_at,
    pa.updated_at
FROM rh.premiacao_assignments pa
JOIN rh.benefit_configurations bc ON (
    bc.company_id = pa.company_id 
    AND bc.benefit_type = 'premiacao'
    AND bc.name = (
        SELECT name FROM rh.premiacao_configs pc 
        WHERE pc.id = pa.premiacao_config_id
    )
)
WHERE NOT EXISTS (
    SELECT 1 FROM rh.employee_benefit_assignments eba 
    WHERE eba.employee_id = pa.employee_id 
    AND eba.benefit_config_id = bc.id
    AND eba.start_date = CURRENT_DATE
);

-- 5. MIGRAR DADOS DE PROCESSAMENTO HISTÓRICO
-- =====================================================

-- Migrar dados de rh.funcionario_beneficios_historico para rh.monthly_benefit_processing
INSERT INTO rh.monthly_benefit_processing (
    employee_id,
    benefit_config_id,
    company_id,
    month_reference,
    year_reference,
    base_value,
    final_value,
    discount_value,
    status,
    created_at,
    updated_at
)
SELECT 
    fbh.employee_id,
    bc.id as benefit_config_id,
    fbh.company_id,
    fbh.mes_referencia as month_reference,
    fbh.ano_referencia as year_reference,
    COALESCE(fbh.valor_beneficio, 0) as base_value,
    COALESCE(fbh.valor_final, 0) as final_value,
    COALESCE(fbh.valor_desconto, 0) as discount_value,
    CASE 
        WHEN fbh.status = 'processado' THEN 'calculated'::rh.processing_status_enum
        WHEN fbh.status = 'pago' THEN 'paid'::rh.processing_status_enum
        ELSE 'pending'::rh.processing_status_enum
    END as status,
    fbh.created_at,
    fbh.updated_at
FROM rh.funcionario_beneficios_historico fbh
LEFT JOIN rh.benefit_configurations bc ON (
    bc.company_id = fbh.company_id 
    AND bc.benefit_type = CASE 
        WHEN fbh.benefit_id IN (
            SELECT id FROM rh.benefits WHERE LOWER(nome) LIKE '%vr%' OR LOWER(nome) LIKE '%va%'
        ) THEN 'vr_va'::rh.benefit_type_enum
        WHEN fbh.benefit_id IN (
            SELECT id FROM rh.benefits WHERE LOWER(nome) LIKE '%transporte%' OR LOWER(nome) LIKE '%vale%'
        ) THEN 'transporte'::rh.benefit_type_enum
        WHEN fbh.benefit_id IN (
            SELECT id FROM rh.benefits WHERE LOWER(nome) LIKE '%equipamento%' OR LOWER(nome) LIKE '%locação%'
        ) THEN 'equipment_rental'::rh.benefit_type_enum
        WHEN fbh.benefit_id IN (
            SELECT id FROM rh.benefits WHERE LOWER(nome) LIKE '%premiação%' OR LOWER(nome) LIKE '%produtividade%'
        ) THEN 'premiacao'::rh.benefit_type_enum
        ELSE 'vr_va'::rh.benefit_type_enum
    END
)
WHERE bc.id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM rh.monthly_benefit_processing mbp 
    WHERE mbp.employee_id = fbh.employee_id 
    AND mbp.benefit_config_id = bc.id
    AND mbp.month_reference = fbh.mes_referencia
    AND mbp.year_reference = fbh.ano_referencia
);

-- 6. CRIAR DADOS PADRÃO PARA EMPRESAS SEM CONFIGURAÇÕES
-- =====================================================

-- Criar configurações padrão para VR/VA se não existirem
INSERT INTO rh.benefit_configurations (
    company_id,
    benefit_type,
    name,
    description,
    calculation_type,
    base_value,
    is_active,
    flash_category
)
SELECT DISTINCT
    uc.company_id,
    'vr_va'::rh.benefit_type_enum,
    'VR/VA Padrão',
    'Configuração padrão de VR/VA',
    'fixed_value'::rh.calculation_type_enum,
    500.00 as base_value,
    true as is_active,
    'REFEICAO E ALIMENTACAO' as flash_category
FROM core.user_companies uc
WHERE NOT EXISTS (
    SELECT 1 FROM rh.benefit_configurations bc 
    WHERE bc.company_id = uc.company_id 
    AND bc.benefit_type = 'vr_va'
);

-- Criar configurações padrão para Transporte se não existirem
INSERT INTO rh.benefit_configurations (
    company_id,
    benefit_type,
    name,
    description,
    calculation_type,
    base_value,
    is_active,
    flash_category
)
SELECT DISTINCT
    uc.company_id,
    'transporte'::rh.benefit_type_enum,
    'Vale Transporte Padrão',
    'Configuração padrão de Vale Transporte',
    'fixed_value'::rh.calculation_type_enum,
    200.00 as base_value,
    true as is_active,
    'VALE TRANSPORTE PIX' as flash_category
FROM core.user_companies uc
WHERE NOT EXISTS (
    SELECT 1 FROM rh.benefit_configurations bc 
    WHERE bc.company_id = uc.company_id 
    AND bc.benefit_type = 'transporte'
);

-- 7. ATUALIZAR ESTATÍSTICAS DAS TABELAS
-- =====================================================

ANALYZE rh.benefit_configurations;
ANALYZE rh.employee_benefit_assignments;
ANALYZE rh.monthly_benefit_processing;
ANALYZE rh.benefit_payments;
