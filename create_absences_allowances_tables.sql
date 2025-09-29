-- =====================================================
-- CADASTROS AVANÇADOS - AFASTAMENTOS E ADICIONAIS
-- =====================================================

-- Tabela para tipos de afastamento
CREATE TABLE IF NOT EXISTS rh.absence_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'FERIAS', 'LICENCA_MEDICA', 'LICENCA_MATERNIDADE', 'LICENCA_PATERNIDADE', 'LICENCA_SEM_VENCIMENTO', 'AFASTAMENTO'
    is_paid BOOLEAN NOT NULL DEFAULT true, -- Se é remunerado
    requires_medical_certificate BOOLEAN NOT NULL DEFAULT false, -- Se requer atestado médico
    requires_approval BOOLEAN NOT NULL DEFAULT true, -- Se requer aprovação
    max_days INTEGER, -- Máximo de dias permitidos
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT absence_types_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para tipos de adicionais
CREATE TABLE IF NOT EXISTS rh.allowance_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'PERCENTUAL', 'VALOR_FIXO', 'HORA_EXTRA'
    valor DECIMAL(10,4) NOT NULL, -- Valor do adicional (percentual ou valor fixo)
    unidade VARCHAR(20) NOT NULL, -- 'PERCENTUAL', 'REAIS', 'HORAS'
    base_calculo VARCHAR(50) NOT NULL, -- 'SALARIO_BASE', 'SALARIO_TOTAL', 'HORAS_TRABALHADAS'
    is_cumulative BOOLEAN NOT NULL DEFAULT false, -- Se pode ser cumulativo com outros adicionais
    requires_approval BOOLEAN NOT NULL DEFAULT true, -- Se requer aprovação
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT allowance_types_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para afastamentos dos funcionários
CREATE TABLE IF NOT EXISTS rh.employee_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    absence_type_id UUID NOT NULL REFERENCES rh.absence_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT, -- Motivo do afastamento
    medical_certificate_url TEXT, -- URL do atestado médico se aplicável
    cid_code_id UUID REFERENCES rh.cid_codes(id), -- CID do atestado se aplicável
    approved_by UUID REFERENCES core.users(id), -- Quem aprovou o afastamento
    approved_at TIMESTAMP WITH TIME ZONE, -- Quando foi aprovado
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'APROVADO', 'REJEITADO', 'EM_ANDAMENTO', 'CONCLUIDO'
    rejection_reason TEXT, -- Motivo da rejeição se aplicável
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT employee_absences_dates_check CHECK (end_date >= start_date)
);

-- Tabela para adicionais dos funcionários
CREATE TABLE IF NOT EXISTS rh.employee_allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    allowance_type_id UUID NOT NULL REFERENCES rh.allowance_types(id),
    start_date DATE NOT NULL,
    end_date DATE, -- NULL para adicionais permanentes
    valor DECIMAL(10,4) NOT NULL, -- Valor específico para este funcionário
    observacoes TEXT, -- Observações sobre o adicional
    approved_by UUID REFERENCES core.users(id), -- Quem aprovou o adicional
    approved_at TIMESTAMP WITH TIME ZONE, -- Quando foi aprovado
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'APROVADO', 'REJEITADO', 'ATIVO', 'INATIVO'
    rejection_reason TEXT, -- Motivo da rejeição se aplicável
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT employee_allowances_dates_check CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_absence_types_company ON rh.absence_types(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_absence_types_categoria ON rh.absence_types(categoria, is_active);
CREATE INDEX IF NOT EXISTS idx_allowance_types_company ON rh.allowance_types(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_allowance_types_tipo ON rh.allowance_types(tipo, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_absences_employee ON rh.employee_absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_absences_dates ON rh.employee_absences(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_absences_status ON rh.employee_absences(status);
CREATE INDEX IF NOT EXISTS idx_employee_absences_company ON rh.employee_absences(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_employee ON rh.employee_allowances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_dates ON rh.employee_allowances(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_status ON rh.employee_allowances(status);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_company ON rh.employee_allowances(company_id, is_active);

-- Inserir dados iniciais para tipos de afastamento
INSERT INTO rh.absence_types (codigo, descricao, categoria, is_paid, requires_medical_certificate, requires_approval, max_days, company_id) VALUES
-- Férias
('FERIAS', 'Férias anuais', 'FERIAS', true, false, true, 30, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('FERIAS_1_3', 'Férias 1/3', 'FERIAS', true, false, true, 10, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Licenças médicas
('LIC_MEDICA', 'Licença médica', 'LICENCA_MEDICA', true, true, true, 120, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('ACIDENTE_TRAB', 'Acidente de trabalho', 'LICENCA_MEDICA', true, true, true, 365, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('DOENCA_OCUP', 'Doença ocupacional', 'LICENCA_MEDICA', true, true, true, 365, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Licenças familiares
('LIC_MATERN', 'Licença maternidade', 'LICENCA_MATERNIDADE', true, true, true, 120, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('LIC_PATERN', 'Licença paternidade', 'LICENCA_PATERNIDADE', true, false, true, 20, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('LIC_LUTO', 'Licença por luto', 'LICENCA_SEM_VENCIMENTO', true, false, true, 8, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Outros afastamentos
('LIC_SEM_VENC', 'Licença sem vencimento', 'LICENCA_SEM_VENCIMENTO', false, false, true, 90, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('SUSPENSAO', 'Suspensão disciplinar', 'AFASTAMENTO', false, false, true, 30, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Inserir dados iniciais para tipos de adicionais
INSERT INTO rh.allowance_types (codigo, descricao, tipo, valor, unidade, base_calculo, is_cumulative, requires_approval, company_id) VALUES
-- Adicionais de periculosidade e insalubridade
('PERICULOS', 'Adicional de periculosidade', 'PERCENTUAL', 30.0000, 'PERCENTUAL', 'SALARIO_BASE', false, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('INSALUBRID', 'Adicional de insalubridade', 'PERCENTUAL', 20.0000, 'PERCENTUAL', 'SALARIO_BASE', false, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Adicionais de horário
('NOTURNO', 'Adicional noturno', 'PERCENTUAL', 20.0000, 'PERCENTUAL', 'SALARIO_BASE', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('SOBREAVISO', 'Adicional de sobreaviso', 'PERCENTUAL', 33.3333, 'PERCENTUAL', 'SALARIO_BASE', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('HORA_EXTRA', 'Hora extra', 'PERCENTUAL', 50.0000, 'PERCENTUAL', 'SALARIO_BASE', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Adicionais de função
('FUNCAO', 'Adicional de função', 'PERCENTUAL', 10.0000, 'PERCENTUAL', 'SALARIO_BASE', true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('GRATIFICACAO', 'Gratificação', 'VALOR_FIXO', 500.0000, 'REAIS', 'SALARIO_BASE', true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Adicionais de localização
('LOCALIZACAO', 'Adicional de localização', 'VALOR_FIXO', 200.0000, 'REAIS', 'SALARIO_BASE', true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('TRANSPORTE', 'Adicional de transporte', 'VALOR_FIXO', 100.0000, 'REAIS', 'SALARIO_BASE', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Adicionais de produtividade
('PRODUTIVID', 'Adicional de produtividade', 'PERCENTUAL', 15.0000, 'PERCENTUAL', 'SALARIO_TOTAL', true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('COMISSAO', 'Comissão', 'PERCENTUAL', 5.0000, 'PERCENTUAL', 'SALARIO_TOTAL', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE rh.absence_types IS 'Tipos de afastamento dos funcionários';
COMMENT ON TABLE rh.allowance_types IS 'Tipos de adicionais salariais';
COMMENT ON TABLE rh.employee_absences IS 'Afastamentos dos funcionários';
COMMENT ON TABLE rh.employee_allowances IS 'Adicionais dos funcionários';





























































