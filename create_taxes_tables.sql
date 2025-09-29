-- =====================================================
-- CADASTROS AVANÇADOS - IMPOSTOS (INSS, IRRF, FGTS)
-- =====================================================

-- Tabela para faixas de contribuição INSS
CREATE TABLE IF NOT EXISTS rh.inss_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    salario_minimo DECIMAL(10,2) NOT NULL,
    salario_maximo DECIMAL(10,2) NOT NULL,
    aliquota DECIMAL(5,4) NOT NULL, -- Alíquota em percentual (ex: 0.0750 = 7.5%)
    valor_deducao DECIMAL(10,2) DEFAULT 0, -- Valor a deduzir se aplicável
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT inss_brackets_company_codigo_unique UNIQUE (company_id, codigo),
    CONSTRAINT inss_brackets_salario_check CHECK (salario_maximo >= salario_minimo)
);

-- Tabela para faixas de IRRF
CREATE TABLE IF NOT EXISTS rh.irrf_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    salario_minimo DECIMAL(10,2) NOT NULL,
    salario_maximo DECIMAL(10,2) NOT NULL,
    aliquota DECIMAL(5,4) NOT NULL, -- Alíquota em percentual
    valor_deducao DECIMAL(10,2) NOT NULL, -- Valor a deduzir
    dependentes_deducao DECIMAL(10,2) DEFAULT 0, -- Dedução por dependente
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT irrf_brackets_company_codigo_unique UNIQUE (company_id, codigo),
    CONSTRAINT irrf_brackets_salario_check CHECK (salario_maximo >= salario_minimo)
);

-- Tabela para configurações FGTS
CREATE TABLE IF NOT EXISTS rh.fgts_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    aliquota DECIMAL(5,4) NOT NULL, -- Alíquota do FGTS (ex: 0.08 = 8%)
    valor_maximo DECIMAL(10,2), -- Valor máximo para aplicação da alíquota
    valor_minimo DECIMAL(10,2) DEFAULT 0, -- Valor mínimo para aplicação da alíquota
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT fgts_config_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para histórico de cálculos de impostos
CREATE TABLE IF NOT EXISTS rh.employee_tax_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    reference_month DATE NOT NULL, -- Mês de referência (YYYY-MM-01)
    salario_bruto DECIMAL(10,2) NOT NULL,
    inss_bracket_id UUID REFERENCES rh.inss_brackets(id),
    inss_valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    irrf_bracket_id UUID REFERENCES rh.irrf_brackets(id),
    irrf_valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    fgts_config_id UUID REFERENCES rh.fgts_config(id),
    fgts_valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    dependentes_irrf INTEGER DEFAULT 0, -- Número de dependentes para IRRF
    outros_descontos DECIMAL(10,2) DEFAULT 0, -- Outros descontos
    salario_liquido DECIMAL(10,2) NOT NULL, -- Salário líquido calculado
    observacoes TEXT, -- Observações sobre o cálculo
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT employee_tax_calculations_employee_month_unique UNIQUE (employee_id, reference_month)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_inss_brackets_company ON rh.inss_brackets(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inss_brackets_salario ON rh.inss_brackets(salario_minimo, salario_maximo);
CREATE INDEX IF NOT EXISTS idx_irrf_brackets_company ON rh.irrf_brackets(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_irrf_brackets_salario ON rh.irrf_brackets(salario_minimo, salario_maximo);
CREATE INDEX IF NOT EXISTS idx_fgts_config_company ON rh.fgts_config(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_tax_calculations_employee ON rh.employee_tax_calculations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_tax_calculations_month ON rh.employee_tax_calculations(reference_month);
CREATE INDEX IF NOT EXISTS idx_employee_tax_calculations_company ON rh.employee_tax_calculations(company_id, is_active);

-- Inserir dados iniciais para faixas INSS (2024)
INSERT INTO rh.inss_brackets (codigo, descricao, salario_minimo, salario_maximo, aliquota, valor_deducao, company_id) VALUES
('INSS_1', '1ª Faixa INSS', 0.00, 1320.00, 0.0750, 0.00, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('INSS_2', '2ª Faixa INSS', 1320.01, 2571.29, 0.0900, 19.80, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('INSS_3', '3ª Faixa INSS', 2571.30, 3856.94, 0.1200, 96.94, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('INSS_4', '4ª Faixa INSS', 3856.95, 7507.49, 0.1400, 174.08, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('INSS_TETO', 'Teto INSS', 7507.49, 999999.99, 0.1400, 174.08, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Inserir dados iniciais para faixas IRRF (2024)
INSERT INTO rh.irrf_brackets (codigo, descricao, salario_minimo, salario_maximo, aliquota, valor_deducao, dependentes_deducao, company_id) VALUES
('IRRF_1', '1ª Faixa IRRF', 0.00, 2282.00, 0.0000, 0.00, 227.50, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('IRRF_2', '2ª Faixa IRRF', 2282.01, 3391.00, 0.0750, 171.15, 227.50, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('IRRF_3', '3ª Faixa IRRF', 3391.01, 4500.00, 0.1500, 512.10, 227.50, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('IRRF_4', '4ª Faixa IRRF', 4500.01, 5597.00, 0.2250, 923.58, 227.50, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('IRRF_5', '5ª Faixa IRRF', 5597.01, 999999.99, 0.2750, 1251.20, 227.50, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Inserir dados iniciais para configurações FGTS
INSERT INTO rh.fgts_config (codigo, descricao, aliquota, valor_maximo, valor_minimo, company_id) VALUES
('FGTS_NORMAL', 'FGTS Normal', 0.0800, 999999.99, 0.00, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('FGTS_APRENDIZ', 'FGTS Aprendiz', 0.0200, 999999.99, 0.00, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('FGTS_DOMESTICO', 'FGTS Doméstico', 0.0800, 999999.99, 0.00, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE rh.inss_brackets IS 'Faixas de contribuição INSS';
COMMENT ON TABLE rh.irrf_brackets IS 'Faixas de Imposto de Renda Retido na Fonte';
COMMENT ON TABLE rh.fgts_config IS 'Configurações de FGTS';
COMMENT ON TABLE rh.employee_tax_calculations IS 'Histórico de cálculos de impostos dos funcionários';






























































