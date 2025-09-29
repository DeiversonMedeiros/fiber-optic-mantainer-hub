-- ============================================================================
-- MIGRAÇÃO: Sistema de Geração Automática de Matrícula para Funcionários
-- ============================================================================

-- Função para gerar matrícula automática baseada no padrão:
-- Empresa: 01, Usuário (sequência): 01 -> Matrícula: 010001
-- Empresa: 01, Usuário (sequência): 02 -> Matrícula: 010002
-- Empresa: 02, Usuário (sequência): 01 -> Matrícula: 020001
-- etc.

CREATE OR REPLACE FUNCTION rh.generate_employee_matricula(company_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    company_code TEXT;
    next_sequence INTEGER;
    generated_matricula TEXT;
BEGIN
    -- Obter o código da empresa (sequencial baseado no ID ou ordem de criação)
    -- Como não temos um campo específico para código da empresa, vamos usar uma lógica baseada na ordem
    SELECT 
        LPAD(ROW_NUMBER() OVER (ORDER BY c.created_at)::TEXT, 2, '0')
    INTO company_code
    FROM core.companies c
    WHERE c.id = company_id_param;
    
    -- Se a empresa não for encontrada, usar código padrão
    IF company_code IS NULL THEN
        company_code := '01';
    END IF;
    
    -- Obter o próximo número da sequência para esta empresa
    SELECT 
        COALESCE(MAX(
            CAST(SUBSTRING(matricula FROM 3 FOR 4) AS INTEGER)
        ), 0) + 1
    INTO next_sequence
    FROM rh.employees
    WHERE matricula ~ ('^' || company_code || '[0-9]{4}$')
    AND company_id = company_id_param;
    
    -- Gerar a matrícula no formato: [código_empresa][sequência_4_dígitos]
    generated_matricula := company_code || LPAD(next_sequence::TEXT, 4, '0');
    
    RETURN generated_matricula;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar a matrícula automaticamente ao inserir um funcionário
CREATE OR REPLACE FUNCTION rh.set_employee_matricula()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a matrícula não foi fornecida ou está vazia, gerar automaticamente
    IF NEW.matricula IS NULL OR NEW.matricula = '' THEN
        NEW.matricula := rh.generate_employee_matricula(NEW.company_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar automaticamente a geração da matrícula
DROP TRIGGER IF EXISTS trigger_set_employee_matricula ON rh.employees;
CREATE TRIGGER trigger_set_employee_matricula
    BEFORE INSERT ON rh.employees
    FOR EACH ROW
    EXECUTE FUNCTION rh.set_employee_matricula();

-- Função para reordenar matrículas existentes (opcional - para reorganizar dados existentes)
CREATE OR REPLACE FUNCTION rh.reorganize_employee_matriculas()
RETURNS VOID AS $$
DECLARE
    company_record RECORD;
    employee_record RECORD;
    sequence_counter INTEGER;
BEGIN
    -- Para cada empresa
    FOR company_record IN 
        SELECT DISTINCT company_id FROM rh.employees ORDER BY company_id
    LOOP
        sequence_counter := 1;
        
        -- Para cada funcionário da empresa, ordenado por data de criação
        FOR employee_record IN
            SELECT id FROM rh.employees 
            WHERE company_id = company_record.company_id 
            ORDER BY created_at ASC
        LOOP
            -- Atualizar a matrícula
            UPDATE rh.employees 
            SET matricula = rh.generate_employee_matricula(company_record.company_id)
            WHERE id = employee_record.id;
            
            sequence_counter := sequence_counter + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION rh.generate_employee_matricula(UUID) IS 'Gera matrícula automática para funcionário baseada no código da empresa e sequência';
COMMENT ON FUNCTION rh.set_employee_matricula() IS 'Trigger function para definir matrícula automaticamente ao inserir funcionário';
COMMENT ON FUNCTION rh.reorganize_employee_matriculas() IS 'Reorganiza matrículas existentes seguindo o novo padrão';
