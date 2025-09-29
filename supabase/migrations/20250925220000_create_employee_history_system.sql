-- Sistema de Histórico de Funcionários
-- Registra todas as movimentações importantes do funcionário

-- Tabela para tipos de movimentação
CREATE TABLE IF NOT EXISTS rh.employee_movement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos de movimentação padrão
INSERT INTO rh.employee_movement_types (codigo, nome, descricao) VALUES
('ADMISSAO', 'Admissão', 'Contratação do funcionário'),
('PROMOCAO', 'Promoção', 'Promoção de cargo'),
('REBAIXAMENTO', 'Rebaixamento', 'Rebaixamento de cargo'),
('MUDANCA_FUNCAO', 'Mudança de Função', 'Mudança de função/cargo'),
('MUDANCA_CC', 'Mudança de Centro de Custo', 'Transferência de centro de custo'),
('MUDANCA_PROJETO', 'Mudança de Projeto', 'Transferência de projeto'),
('MUDANCA_TURNO', 'Mudança de Turno', 'Mudança de turno de trabalho'),
('MUDANCA_DEPARTAMENTO', 'Mudança de Departamento', 'Transferência de departamento'),
('MUDANCA_SALARIO', 'Mudança de Salário', 'Alteração de salário'),
('MUDANCA_STATUS', 'Mudança de Status', 'Mudança de status do funcionário'),
('FERIAS', 'Férias', 'Período de férias'),
('LICENCA', 'Licença', 'Período de licença'),
('DEMISSAO', 'Demissão', 'Desligamento do funcionário'),
('APOSENTADORIA', 'Aposentadoria', 'Aposentadoria do funcionário'),
('TRANSFERENCIA', 'Transferência', 'Transferência interna ou externa')
ON CONFLICT (codigo) DO NOTHING;

-- Tabela principal de histórico
CREATE TABLE IF NOT EXISTS rh.employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    movement_type_id UUID NOT NULL REFERENCES rh.employee_movement_types(id),
    
    -- Dados anteriores (antes da mudança)
    previous_position_id UUID REFERENCES rh.positions(id),
    previous_cost_center_id UUID REFERENCES core.cost_centers(id),
    previous_project_id UUID REFERENCES core.projects(id),
    previous_department_id UUID REFERENCES rh.departments(id),
    previous_work_shift_id UUID REFERENCES rh.work_shifts(id),
    previous_manager_id UUID REFERENCES rh.employees(id),
    previous_salario_base DECIMAL(10,2),
    previous_status TEXT,
    
    -- Dados novos (após a mudança)
    new_position_id UUID REFERENCES rh.positions(id),
    new_cost_center_id UUID REFERENCES core.cost_centers(id),
    new_project_id UUID REFERENCES core.projects(id),
    new_department_id UUID REFERENCES rh.departments(id),
    new_work_shift_id UUID REFERENCES rh.work_shifts(id),
    new_manager_id UUID REFERENCES rh.employees(id),
    new_salario_base DECIMAL(10,2),
    new_status TEXT,
    
    -- Metadados
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    description TEXT,
    attachment_url TEXT,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employee_history_employee_id ON rh.employee_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_company_id ON rh.employee_history(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_movement_type ON rh.employee_history(movement_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_effective_date ON rh.employee_history(effective_date);
CREATE INDEX IF NOT EXISTS idx_employee_history_created_at ON rh.employee_history(created_at);

-- Comentários
COMMENT ON TABLE rh.employee_movement_types IS 'Tipos de movimentação de funcionários';
COMMENT ON TABLE rh.employee_history IS 'Histórico completo de movimentações dos funcionários';

COMMENT ON COLUMN rh.employee_history.effective_date IS 'Data de efetivação da mudança';
COMMENT ON COLUMN rh.employee_history.reason IS 'Motivo da movimentação';
COMMENT ON COLUMN rh.employee_history.description IS 'Descrição detalhada da movimentação';
COMMENT ON COLUMN rh.employee_history.attachment_url IS 'URL de documento anexo (contrato, portaria, etc.)';

-- Função para registrar mudanças automaticamente
CREATE OR REPLACE FUNCTION rh.log_employee_changes()
RETURNS TRIGGER AS $$
DECLARE
    movement_type_id UUID;
    change_detected BOOLEAN := FALSE;
    movement_description TEXT := '';
BEGIN
    -- Verificar se é uma atualização (não inserção)
    IF TG_OP = 'UPDATE' THEN
        -- Determinar o tipo de movimentação baseado nas mudanças
        change_detected := FALSE;
        
        -- Verificar mudança de cargo/posição
        IF OLD.position_id IS DISTINCT FROM NEW.position_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_FUNCAO';
            movement_description := COALESCE(movement_description || '; ', '') || 'Mudança de cargo';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudança de centro de custo
        IF OLD.cost_center_id IS DISTINCT FROM NEW.cost_center_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_CC';
            movement_description := COALESCE(movement_description || '; ', '') || 'Mudança de centro de custo';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudança de projeto
        IF OLD.project_id IS DISTINCT FROM NEW.project_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_PROJETO';
            movement_description := COALESCE(movement_description || '; ', '') || 'Mudança de projeto';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudança de departamento
        IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_DEPARTAMENTO';
            movement_description := COALESCE(movement_description || '; ', '') || 'Mudança de departamento';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudança de turno
        IF OLD.work_shift_id IS DISTINCT FROM NEW.work_shift_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_TURNO';
            movement_description := COALESCE(movement_description || '; ', '') || 'Mudança de turno';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudança de salário
        IF OLD.salario_base IS DISTINCT FROM NEW.salario_base THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_SALARIO';
            movement_description := COALESCE(movement_description || '; ', '') || 'Mudança de salário';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudança de status
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_STATUS';
            movement_description := COALESCE(movement_description || '; ', '') || 'Mudança de status';
            change_detected := TRUE;
        END IF;
        
        -- Se houve mudanças, registrar no histórico
        IF change_detected THEN
            INSERT INTO rh.employee_history (
                employee_id,
                company_id,
                movement_type_id,
                previous_position_id,
                previous_cost_center_id,
                previous_project_id,
                previous_department_id,
                previous_work_shift_id,
                previous_manager_id,
                previous_salario_base,
                previous_status,
                new_position_id,
                new_cost_center_id,
                new_project_id,
                new_department_id,
                new_work_shift_id,
                new_manager_id,
                new_salario_base,
                new_status,
                effective_date,
                description,
                created_by
            ) VALUES (
                NEW.id,
                NEW.company_id,
                movement_type_id,
                OLD.position_id,
                OLD.cost_center_id,
                OLD.project_id,
                OLD.department_id,
                OLD.work_shift_id,
                OLD.manager_id,
                OLD.salario_base,
                OLD.status,
                NEW.position_id,
                NEW.cost_center_id,
                NEW.project_id,
                NEW.department_id,
                NEW.work_shift_id,
                NEW.manager_id,
                NEW.salario_base,
                NEW.status,
                CURRENT_DATE,
                movement_description,
                auth.uid()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar mudanças automaticamente
DROP TRIGGER IF EXISTS trigger_log_employee_changes ON rh.employees;
CREATE TRIGGER trigger_log_employee_changes
    AFTER UPDATE ON rh.employees
    FOR EACH ROW
    EXECUTE FUNCTION rh.log_employee_changes();

-- Função para registrar admissão
CREATE OR REPLACE FUNCTION rh.log_employee_admission()
RETURNS TRIGGER AS $$
DECLARE
    movement_type_id UUID;
BEGIN
    -- Obter o ID do tipo de movimentação "ADMISSAO"
    SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'ADMISSAO';
    
    -- Registrar a admissão no histórico
    INSERT INTO rh.employee_history (
        employee_id,
        company_id,
        movement_type_id,
        new_position_id,
        new_cost_center_id,
        new_project_id,
        new_department_id,
        new_work_shift_id,
        new_manager_id,
        new_salario_base,
        new_status,
        effective_date,
        description,
        created_by
    ) VALUES (
        NEW.id,
        NEW.company_id,
        movement_type_id,
        NEW.position_id,
        NEW.cost_center_id,
        NEW.project_id,
        NEW.department_id,
        NEW.work_shift_id,
        NEW.manager_id,
        NEW.salario_base,
        NEW.status,
        NEW.data_admissao::DATE,
        'Admissão do funcionário',
        auth.uid()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar admissão
DROP TRIGGER IF EXISTS trigger_log_employee_admission ON rh.employees;
CREATE TRIGGER trigger_log_employee_admission
    AFTER INSERT ON rh.employees
    FOR EACH ROW
    EXECUTE FUNCTION rh.log_employee_admission();

-- RLS Policies
ALTER TABLE rh.employee_movement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.employee_history ENABLE ROW LEVEL SECURITY;

-- Políticas para employee_movement_types (apenas leitura para usuários autenticados)
CREATE POLICY "employee_movement_types_select_policy" ON rh.employee_movement_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para employee_history
CREATE POLICY "employee_history_select_policy" ON rh.employee_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "employee_history_insert_policy" ON rh.employee_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "employee_history_update_policy" ON rh.employee_history
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Função para obter histórico de um funcionário
CREATE OR REPLACE FUNCTION rh.get_employee_history(employee_uuid UUID)
RETURNS TABLE (
    id UUID,
    movement_type_codigo TEXT,
    movement_type_nome TEXT,
    previous_data JSONB,
    new_data JSONB,
    effective_date DATE,
    reason TEXT,
    description TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eh.id,
        emt.codigo,
        emt.nome,
        jsonb_build_object(
            'position_id', eh.previous_position_id,
            'cost_center_id', eh.previous_cost_center_id,
            'project_id', eh.previous_project_id,
            'department_id', eh.previous_department_id,
            'work_shift_id', eh.previous_work_shift_id,
            'manager_id', eh.previous_manager_id,
            'salario_base', eh.previous_salario_base,
            'status', eh.previous_status
        ),
        jsonb_build_object(
            'position_id', eh.new_position_id,
            'cost_center_id', eh.new_cost_center_id,
            'project_id', eh.new_project_id,
            'department_id', eh.new_department_id,
            'work_shift_id', eh.new_work_shift_id,
            'manager_id', eh.new_manager_id,
            'salario_base', eh.new_salario_base,
            'status', eh.new_status
        ),
        eh.effective_date,
        eh.reason,
        eh.description,
        eh.attachment_url,
        eh.created_at,
        COALESCE(up.full_name, au.email) as created_by_name
    FROM rh.employee_history eh
    JOIN rh.employee_movement_types emt ON eh.movement_type_id = emt.id
    LEFT JOIN auth.users au ON eh.created_by = au.id
    LEFT JOIN core.user_profiles up ON au.id = up.id
    WHERE eh.employee_id = employee_uuid
    ORDER BY eh.effective_date DESC, eh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário na função
COMMENT ON FUNCTION rh.get_employee_history(UUID) IS 'Retorna o histórico completo de movimentações de um funcionário';
