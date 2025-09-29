-- =====================================================
-- CADASTROS AVANÇADOS - PCD E DEPENDENTES
-- =====================================================

-- Tabela para tipos de deficiência (PCD)
CREATE TABLE IF NOT EXISTS rh.deficiency_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT deficiency_types_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para graus de deficiência
CREATE TABLE IF NOT EXISTS rh.deficiency_degrees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT deficiency_degrees_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para tipos de dependentes
CREATE TABLE IF NOT EXISTS rh.dependent_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT dependent_types_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para graus de parentesco
CREATE TABLE IF NOT EXISTS rh.kinship_degrees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT kinship_degrees_company_codigo_unique UNIQUE (company_id, codigo)
);

-- Tabela para informações de PCD dos funcionários
CREATE TABLE IF NOT EXISTS rh.employee_pcd_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    is_pcd BOOLEAN NOT NULL DEFAULT false,
    deficiency_type_id UUID REFERENCES rh.deficiency_types(id),
    deficiency_degree_id UUID REFERENCES rh.deficiency_degrees(id),
    cid_code VARCHAR(10), -- Código CID da deficiência
    cid_description TEXT, -- Descrição da deficiência
    needs_accommodation BOOLEAN DEFAULT false,
    accommodation_description TEXT,
    medical_certificate_url TEXT,
    certificate_validity DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT employee_pcd_info_employee_unique UNIQUE (employee_id)
);

-- Tabela para dependentes dos funcionários
CREATE TABLE IF NOT EXISTS rh.employee_dependents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    birth_date DATE NOT NULL,
    dependent_type_id UUID NOT NULL REFERENCES rh.dependent_types(id),
    kinship_degree_id UUID NOT NULL REFERENCES rh.kinship_degrees(id),
    is_pcd BOOLEAN DEFAULT false,
    deficiency_type_id UUID REFERENCES rh.deficiency_types(id),
    deficiency_degree_id UUID REFERENCES rh.deficiency_degrees(id),
    cid_code VARCHAR(10),
    cid_description TEXT,
    needs_special_care BOOLEAN DEFAULT false,
    special_care_description TEXT,
    is_ir_dependent BOOLEAN DEFAULT true, -- Dependente para IR
    is_health_plan_dependent BOOLEAN DEFAULT true, -- Dependente no plano de saúde
    is_school_allowance_dependent BOOLEAN DEFAULT false, -- Dependente para auxílio escola
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    CONSTRAINT employee_dependents_cpf_unique UNIQUE (cpf)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deficiency_types_company ON rh.deficiency_types(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_deficiency_degrees_company ON rh.deficiency_degrees(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_dependent_types_company ON rh.dependent_types(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_kinship_degrees_company ON rh.kinship_degrees(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_pcd_info_employee ON rh.employee_pcd_info(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_pcd_info_company ON rh.employee_pcd_info(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_dependents_employee ON rh.employee_dependents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_dependents_company ON rh.employee_dependents(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_dependents_cpf ON rh.employee_dependents(cpf);

-- Inserir dados iniciais para tipos de deficiência
INSERT INTO rh.deficiency_types (codigo, descricao, company_id) VALUES
('FISICA', 'Deficiência Física', '2'),
('VISUAL', 'Deficiência Visual', '2'),
('AUDITIVA', 'Deficiência Auditiva', '2'),
('INTELECTUAL', 'Deficiência Intelectual', '2'),
('MULTIPLA', 'Deficiência Múltipla', '2'),
('TRANSTORNO', 'Transtorno do Espectro Autista', '2')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Inserir dados iniciais para graus de deficiência
INSERT INTO rh.deficiency_degrees (codigo, descricao, company_id) VALUES
('LEVE', 'Deficiência Leve', '2'),
('MODERADA', 'Deficiência Moderada', '2'),
('SEVERA', 'Deficiência Severa', '2'),
('PROFUNDA', 'Deficiência Profunda', '2')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Inserir dados iniciais para tipos de dependentes
INSERT INTO rh.dependent_types (codigo, descricao, company_id) VALUES
('FILHO', 'Filho(a)', '2'),
('CONJUGE', 'Cônjuge/Companheiro(a)', '2'),
('PAI', 'Pai', '2'),
('MAE', 'Mãe', '2'),
('IRMAO', 'Irmão(ã)', '2'),
('NETO', 'Neto(a)', '2'),
('BISNETO', 'Bisneto(a)', '2'),
('SOGRO', 'Sogro(a)', '2'),
('ENTEADO', 'Enteado(a)', '2'),
('TUTELADO', 'Tutelado(a)', '2'),
('CURATELADO', 'Curatelado(a)', '2')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Inserir dados iniciais para graus de parentesco
INSERT INTO rh.kinship_degrees (codigo, descricao, company_id) VALUES
('1GRAU', '1º Grau', '2'),
('2GRAU', '2º Grau', '2'),
('3GRAU', '3º Grau', '2'),
('4GRAU', '4º Grau', '2'),
('AFINIDADE', 'Afinidade', '2'),
('TUTELA', 'Tutela', '2'),
('CURATELA', 'Curatela', '2')
ON CONFLICT (company_id, codigo) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE rh.deficiency_types IS 'Tipos de deficiência para PCD';
COMMENT ON TABLE rh.deficiency_degrees IS 'Graus de deficiência';
COMMENT ON TABLE rh.dependent_types IS 'Tipos de dependentes';
COMMENT ON TABLE rh.kinship_degrees IS 'Graus de parentesco';
COMMENT ON TABLE rh.employee_pcd_info IS 'Informações de PCD dos funcionários';
COMMENT ON TABLE rh.employee_dependents IS 'Dependentes dos funcionários';






























































