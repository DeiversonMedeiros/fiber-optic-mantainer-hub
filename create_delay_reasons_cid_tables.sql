-- =====================================================
-- CADASTROS AVANÇADOS - MOTIVOS DE ATRASO E CID
-- =====================================================

-- Tabela para motivos de atraso
CREATE TABLE IF NOT EXISTS rh.delay_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'JUSTIFICADO', 'INJUSTIFICADO', 'FORCA_MAIOR'
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_justification BOOLEAN NOT NULL DEFAULT true,
    requires_medical_certificate BOOLEAN NOT NULL DEFAULT false,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT delay_reasons_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para códigos CID de atestados médicos
CREATE TABLE IF NOT EXISTS rh.cid_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL, -- Código CID (ex: A00, B15.9, F32.1)
    descricao TEXT NOT NULL,
    categoria VARCHAR(100), -- Categoria da doença
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_work_restriction BOOLEAN DEFAULT false, -- Se requer restrição de trabalho
    max_absence_days INTEGER, -- Máximo de dias de afastamento recomendado
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT cid_codes_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para relacionar motivos de atraso com funcionários (histórico)
CREATE TABLE IF NOT EXISTS rh.employee_delay_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    delay_reason_id UUID NOT NULL REFERENCES rh.delay_reasons(id),
    delay_date DATE NOT NULL,
    delay_time TIME NOT NULL, -- Horário do atraso
    justification TEXT, -- Justificativa do funcionário
    medical_certificate_url TEXT, -- URL do atestado médico se aplicável
    cid_code_id UUID REFERENCES rh.cid_codes(id), -- CID do atestado se aplicável
    approved_by UUID REFERENCES core.users(id), -- Quem aprovou a justificativa
    approved_at TIMESTAMP WITH TIME ZONE, -- Quando foi aprovado
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'APROVADO', 'REJEITADO'
    rejection_reason TEXT, -- Motivo da rejeição se aplicável
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_delay_reasons_company ON rh.delay_reasons(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_delay_reasons_categoria ON rh.delay_reasons(categoria, is_active);
CREATE INDEX IF NOT EXISTS idx_cid_codes_company ON rh.cid_codes(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_cid_codes_codigo ON rh.cid_codes(codigo);
CREATE INDEX IF NOT EXISTS idx_employee_delay_records_employee ON rh.employee_delay_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_delay_records_date ON rh.employee_delay_records(delay_date);
CREATE INDEX IF NOT EXISTS idx_employee_delay_records_status ON rh.employee_delay_records(status);
CREATE INDEX IF NOT EXISTS idx_employee_delay_records_company ON rh.employee_delay_records(company_id, is_active);

-- Inserir dados iniciais para motivos de atraso
INSERT INTO rh.delay_reasons (codigo, descricao, categoria, requires_justification, requires_medical_certificate, company_id) VALUES
-- Motivos justificados
('DOENCA', 'Doença/Problema de saúde', 'JUSTIFICADO', true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('FAMILIA', 'Problema familiar urgente', 'JUSTIFICADO', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('TRANSPORTE', 'Problema no transporte público', 'JUSTIFICADO', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('ACIDENTE', 'Acidente de trânsito', 'JUSTIFICADO', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('FUNERAL', 'Falecimento na família', 'JUSTIFICADO', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('FORCA_MAIOR', 'Força maior (enchente, greve, etc)', 'FORCA_MAIOR', true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Motivos injustificados
('SONO', 'Dormiu demais', 'INJUSTIFICADO', false, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('ESQUECEU', 'Esqueceu do horário', 'INJUSTIFICADO', false, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('PESSOAL', 'Questão pessoal', 'INJUSTIFICADO', false, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('SEM_MOTIVO', 'Sem motivo aparente', 'INJUSTIFICADO', false, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Inserir dados iniciais para códigos CID mais comuns
INSERT INTO rh.cid_codes (codigo, descricao, categoria, requires_work_restriction, max_absence_days, company_id) VALUES
-- Doenças respiratórias
('J00', 'Resfriado comum', 'Doenças respiratórias', false, 2, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('J06', 'Infecções agudas das vias aéreas superiores', 'Doenças respiratórias', false, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('J11', 'Gripe', 'Doenças respiratórias', true, 5, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('J44', 'Doença pulmonar obstrutiva crônica', 'Doenças respiratórias', true, 7, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Doenças gastrointestinais
('K59', 'Constipação', 'Doenças gastrointestinais', false, 1, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('K92', 'Sangramento gastrointestinal', 'Doenças gastrointestinais', true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('A09', 'Diarreia e gastroenterite', 'Doenças gastrointestinais', true, 2, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Doenças musculoesqueléticas
('M79', 'Reumatismo não especificado', 'Doenças musculoesqueléticas', true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('M54', 'Dorsalgia', 'Doenças musculoesqueléticas', true, 5, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('M25', 'Outros transtornos articulares', 'Doenças musculoesqueléticas', true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Transtornos mentais
('F32', 'Episódio depressivo', 'Transtornos mentais', true, 7, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('F41', 'Outros transtornos ansiosos', 'Transtornos mentais', true, 5, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('F43', 'Reação ao estresse grave', 'Transtornos mentais', true, 10, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Doenças cardiovasculares
('I10', 'Hipertensão essencial', 'Doenças cardiovasculares', true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('I25', 'Doença isquêmica do coração', 'Doenças cardiovasculares', true, 7, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),

-- Doenças infecciosas
('B34', 'Infecção viral não especificada', 'Doenças infecciosas', true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'),
('A41', 'Sepse', 'Doenças infecciosas', true, 10, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE rh.delay_reasons IS 'Motivos de atraso dos funcionários';
COMMENT ON TABLE rh.cid_codes IS 'Códigos CID para atestados médicos';
COMMENT ON TABLE rh.employee_delay_records IS 'Registro de atrasos dos funcionários';






























































