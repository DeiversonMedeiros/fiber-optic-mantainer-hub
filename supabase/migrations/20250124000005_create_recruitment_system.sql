-- Sistema de Recrutamento e Seleção
-- Migration para criar todas as tabelas do sistema de recrutamento

-- 1. Solicitação de Vagas
CREATE TABLE rh.job_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    requested_by UUID NOT NULL REFERENCES core.users(id),
    position_name TEXT NOT NULL, -- Nome do cargo
    department_name TEXT, -- Nome do departamento
    job_description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    salary_range TEXT,
    urgency_level TEXT CHECK (urgency_level IN ('baixa', 'media', 'alta', 'critica')),
    expected_start_date DATE,
    status TEXT CHECK (status IN ('solicitado', 'em_analise', 'aprovado', 'reprovado', 'pausado')) DEFAULT 'solicitado',
    approved_by UUID REFERENCES core.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Vagas Aprovadas
CREATE TABLE rh.job_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    job_request_id UUID REFERENCES rh.job_requests(id),
    position_name TEXT NOT NULL,
    department_name TEXT,
    job_description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    salary_range TEXT,
    status TEXT CHECK (status IN ('aberta', 'pausada', 'fechada', 'preenchida')) DEFAULT 'aberta',
    open_date DATE DEFAULT CURRENT_DATE,
    close_date DATE,
    created_by UUID NOT NULL REFERENCES core.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Processos Seletivos
CREATE TABLE rh.selection_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    job_opening_id UUID NOT NULL REFERENCES rh.job_openings(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('ativo', 'pausado', 'finalizado', 'cancelado')) DEFAULT 'ativo',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_by UUID NOT NULL REFERENCES core.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Etapas do Processo Seletivo
CREATE TABLE rh.selection_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    selection_process_id UUID NOT NULL REFERENCES rh.selection_processes(id),
    name TEXT NOT NULL,
    description TEXT,
    stage_type TEXT CHECK (stage_type IN ('triagem', 'entrevista', 'prova_tecnica', 'dinamica', 'entrevista_final', 'aprovacao', 'reprovacao')) NOT NULL,
    order_index INTEGER NOT NULL,
    is_final_stage BOOLEAN DEFAULT false,
    passing_criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Candidatos
CREATE TABLE rh.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cpf TEXT,
    birth_date DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    resume_file_path TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    source TEXT CHECK (source IN ('site', 'linkedin', 'indicacao', 'agencia', 'outro')),
    status TEXT CHECK (status IN ('ativo', 'inativo', 'contratado', 'descartado')) DEFAULT 'ativo',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Inscrições em Vagas
CREATE TABLE rh.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    job_opening_id UUID NOT NULL REFERENCES rh.job_openings(id),
    candidate_id UUID NOT NULL REFERENCES rh.candidates(id),
    selection_process_id UUID NOT NULL REFERENCES rh.selection_processes(id),
    current_stage_id UUID REFERENCES rh.selection_stages(id),
    status TEXT CHECK (status IN ('inscrito', 'em_andamento', 'aprovado', 'reprovado', 'desistiu')) DEFAULT 'inscrito',
    application_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(job_opening_id, candidate_id)
);

-- 7. Resultados das Etapas
CREATE TABLE rh.stage_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_application_id UUID NOT NULL REFERENCES rh.job_applications(id),
    stage_id UUID NOT NULL REFERENCES rh.selection_stages(id),
    evaluator_id UUID NOT NULL REFERENCES core.users(id),
    result TEXT CHECK (result IN ('aprovado', 'reprovado', 'pendente')) NOT NULL,
    score DECIMAL(5,2),
    feedback TEXT,
    interview_notes TEXT,
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Banco de Talentos
CREATE TABLE rh.talent_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    candidate_id UUID NOT NULL REFERENCES rh.candidates(id),
    skill_category TEXT NOT NULL,
    skill_level TEXT CHECK (skill_level IN ('iniciante', 'intermediario', 'avancado', 'especialista')),
    experience_years INTEGER,
    availability TEXT CHECK (availability IN ('imediata', '1_mes', '3_meses', '6_meses', 'indisponivel')),
    interest_areas TEXT[],
    salary_expectation DECIMAL(10,2),
    added_by UUID NOT NULL REFERENCES core.users(id),
    added_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Documentos de Contratação
CREATE TABLE rh.hiring_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    job_application_id UUID NOT NULL REFERENCES rh.job_applications(id),
    candidate_id UUID NOT NULL REFERENCES rh.candidates(id),
    document_type TEXT NOT NULL CHECK (document_type IN (
        'ctps_digital', 'rg_cnh', 'cpf', 'titulo_eleitor', 'comprovante_votacao',
        'certificado_reservista', 'pis_pasep', 'certidao_nascimento', 'certidao_casamento',
        'comprovante_residencia', 'comprovante_escolaridade', 'foto_3x4',
        'cnh', 'registro_profissional', 'certidao_nascimento_filhos', 'cpf_filhos',
        'caderneta_vacinacao', 'comprovante_frequencia_escolar', 'exame_admissional',
        'declaracao_dependentes', 'dados_bancarios'
    )),
    document_name TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'rejeitado')) DEFAULT 'pendente',
    uploaded_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES core.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Links de Upload para Candidatos
CREATE TABLE rh.candidate_upload_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id),
    job_application_id UUID NOT NULL REFERENCES rh.job_applications(id),
    candidate_id UUID NOT NULL REFERENCES rh.candidates(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES core.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_job_requests_company_status ON rh.job_requests(company_id, status);
CREATE INDEX idx_job_openings_company_status ON rh.job_openings(company_id, status);
CREATE INDEX idx_candidates_company_status ON rh.candidates(company_id, status);
CREATE INDEX idx_job_applications_job_opening ON rh.job_applications(job_opening_id);
CREATE INDEX idx_job_applications_candidate ON rh.job_applications(candidate_id);
CREATE INDEX idx_stage_results_application ON rh.stage_results(job_application_id);
CREATE INDEX idx_hiring_documents_candidate ON rh.hiring_documents(candidate_id);
CREATE INDEX idx_hiring_documents_status ON rh.hiring_documents(status);
CREATE INDEX idx_upload_links_token ON rh.candidate_upload_links(token);

-- RLS Policies
ALTER TABLE rh.job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.selection_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.selection_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.stage_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.talent_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.hiring_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.candidate_upload_links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY "Users can view job requests from their company" ON rh.job_requests
    FOR SELECT USING (company_id IN (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view job openings from their company" ON rh.job_openings
    FOR SELECT USING (company_id IN (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view candidates from their company" ON rh.candidates
    FOR SELECT USING (company_id IN (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view job applications from their company" ON rh.job_applications
    FOR SELECT USING (company_id IN (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view hiring documents from their company" ON rh.hiring_documents
    FOR SELECT USING (company_id IN (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()));

-- Funções auxiliares
CREATE OR REPLACE FUNCTION rh.generate_candidate_upload_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_requests_updated_at BEFORE UPDATE ON rh.job_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_openings_updated_at BEFORE UPDATE ON rh.job_openings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON rh.candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON rh.job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hiring_documents_updated_at BEFORE UPDATE ON rh.hiring_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE rh.job_requests IS 'Solicitações de vagas feitas por gestores';
COMMENT ON TABLE rh.job_openings IS 'Vagas aprovadas e abertas para candidatos';
COMMENT ON TABLE rh.selection_processes IS 'Processos seletivos para vagas';
COMMENT ON TABLE rh.selection_stages IS 'Etapas de cada processo seletivo';
COMMENT ON TABLE rh.candidates IS 'Cadastro de candidatos';
COMMENT ON TABLE rh.job_applications IS 'Inscrições de candidatos em vagas';
COMMENT ON TABLE rh.stage_results IS 'Resultados das etapas do processo seletivo';
COMMENT ON TABLE rh.talent_pool IS 'Banco de talentos da empresa';
COMMENT ON TABLE rh.hiring_documents IS 'Documentos de contratação enviados por candidatos';
COMMENT ON TABLE rh.candidate_upload_links IS 'Links seguros para candidatos enviarem documentos';
