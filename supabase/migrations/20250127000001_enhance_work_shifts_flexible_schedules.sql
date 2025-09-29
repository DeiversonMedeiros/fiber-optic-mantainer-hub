-- Melhorar sistema de escalas de trabalho para suportar regras CLT flexíveis
-- Adicionar campos para escalas flexíveis e validações

-- 1. Adicionar novos campos à tabela work_shifts
ALTER TABLE rh.work_shifts 
ADD COLUMN IF NOT EXISTS tipo_escala VARCHAR(50) DEFAULT 'fixa',
ADD COLUMN IF NOT EXISTS dias_trabalho INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS dias_folga INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS ciclo_dias INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS regras_clt JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS template_escala BOOLEAN DEFAULT false;

-- 2. Criar enum para tipos de escala
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_escala_enum') THEN
        CREATE TYPE rh.tipo_escala_enum AS ENUM (
            'fixa',           -- Dias fixos da semana (atual)
            'flexivel_6x1',   -- 6 dias trabalho, 1 folga
            'flexivel_5x2',   -- 5 dias trabalho, 2 folgas
            'flexivel_4x3',   -- 4 dias trabalho, 3 folgas
            'escala_12x36',   -- 12 horas trabalho, 36 horas folga
            'escala_24x48',   -- 24 horas trabalho, 48 horas folga
            'personalizada'   -- Configuração personalizada
        );
    END IF;
END $$;

-- 3. Atualizar coluna tipo_escala para usar o enum
ALTER TABLE rh.work_shifts 
ALTER COLUMN tipo_escala DROP DEFAULT;

ALTER TABLE rh.work_shifts 
ALTER COLUMN tipo_escala TYPE rh.tipo_escala_enum 
USING CASE 
    WHEN tipo_escala = 'fixa' THEN 'fixa'::rh.tipo_escala_enum
    ELSE 'fixa'::rh.tipo_escala_enum
END;

ALTER TABLE rh.work_shifts 
ALTER COLUMN tipo_escala SET DEFAULT 'fixa'::rh.tipo_escala_enum;

-- 4. Criar tabela para configurações de escalas flexíveis
CREATE TABLE IF NOT EXISTS rh.work_shift_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_shift_id UUID NOT NULL REFERENCES rh.work_shifts(id) ON DELETE CASCADE,
    dia_ciclo INTEGER NOT NULL, -- Dia do ciclo (1, 2, 3, etc.)
    tipo_dia VARCHAR(20) NOT NULL CHECK (tipo_dia IN ('trabalho', 'folga')),
    hora_inicio TIME,
    hora_fim TIME,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela para templates de escalas
CREATE TABLE IF NOT EXISTS rh.work_shift_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo_escala rh.tipo_escala_enum NOT NULL,
    dias_trabalho INTEGER NOT NULL,
    dias_folga INTEGER NOT NULL,
    ciclo_dias INTEGER NOT NULL,
    descricao TEXT,
    regras_clt JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_work_shifts_tipo_escala ON rh.work_shifts(tipo_escala);
CREATE INDEX IF NOT EXISTS idx_work_shift_patterns_work_shift_id ON rh.work_shift_patterns(work_shift_id);
CREATE INDEX IF NOT EXISTS idx_work_shift_templates_company_id ON rh.work_shift_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_work_shift_templates_tipo_escala ON rh.work_shift_templates(tipo_escala);

-- 7. Função para validar conformidade CLT
CREATE OR REPLACE FUNCTION rh.validate_clt_compliance(
    p_dias_trabalho INTEGER,
    p_dias_folga INTEGER,
    p_ciclo_dias INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validar se não excede 6 dias consecutivos de trabalho
    IF p_dias_trabalho > 6 THEN
        RETURN FALSE;
    END IF;
    
    -- Validar se tem pelo menos 1 dia de folga por semana
    IF p_dias_folga < 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Validar se o ciclo é válido
    IF p_ciclo_dias < (p_dias_trabalho + p_dias_folga) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Função para gerar padrão de escala flexível
CREATE OR REPLACE FUNCTION rh.generate_flexible_schedule_pattern(
    p_work_shift_id UUID,
    p_dias_trabalho INTEGER,
    p_dias_folga INTEGER,
    p_ciclo_dias INTEGER,
    p_hora_inicio TIME,
    p_hora_fim TIME
) RETURNS VOID AS $$
DECLARE
    dia_ciclo INTEGER;
    tipo_dia VARCHAR(20);
BEGIN
    -- Limpar padrões existentes
    DELETE FROM rh.work_shift_patterns WHERE work_shift_id = p_work_shift_id;
    
    -- Gerar padrão do ciclo
    FOR dia_ciclo IN 1..p_ciclo_dias LOOP
        IF dia_ciclo <= p_dias_trabalho THEN
            tipo_dia := 'trabalho';
        ELSE
            tipo_dia := 'folga';
        END IF;
        
        INSERT INTO rh.work_shift_patterns (
            work_shift_id,
            dia_ciclo,
            tipo_dia,
            hora_inicio,
            hora_fim
        ) VALUES (
            p_work_shift_id,
            dia_ciclo,
            tipo_dia,
            CASE WHEN tipo_dia = 'trabalho' THEN p_hora_inicio ELSE NULL END,
            CASE WHEN tipo_dia = 'trabalho' THEN p_hora_fim ELSE NULL END
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para validar conformidade CLT
CREATE OR REPLACE FUNCTION rh.trigger_validate_clt_compliance()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar conformidade CLT apenas para escalas flexíveis
    IF NEW.tipo_escala != 'fixa' THEN
        IF NOT rh.validate_clt_compliance(NEW.dias_trabalho, NEW.dias_folga, NEW.ciclo_dias) THEN
            RAISE EXCEPTION 'Escala não está em conformidade com a CLT. Máximo 6 dias consecutivos de trabalho e mínimo 1 dia de folga por semana.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar trigger
DROP TRIGGER IF EXISTS trigger_validate_clt_compliance ON rh.work_shifts;
CREATE TRIGGER trigger_validate_clt_compliance
    BEFORE INSERT OR UPDATE ON rh.work_shifts
    FOR EACH ROW
    EXECUTE FUNCTION rh.trigger_validate_clt_compliance();

-- 11. Inserir templates de escalas comuns (apenas se houver empresas)
DO $$
DECLARE
    company_uuid UUID;
BEGIN
    -- Buscar a primeira empresa disponível
    SELECT id INTO company_uuid FROM core.companies LIMIT 1;
    
    -- Se encontrou uma empresa, inserir os templates
    IF company_uuid IS NOT NULL THEN
        INSERT INTO rh.work_shift_templates (company_id, nome, tipo_escala, dias_trabalho, dias_folga, ciclo_dias, descricao, regras_clt) VALUES
        (company_uuid, 'Escala 5x2 (Segunda a Sexta)', 'flexivel_5x2', 5, 2, 7, 'Trabalho de segunda a sexta, folga sábado e domingo', '{"max_horas_diarias": 8, "max_horas_semanais": 44, "intervalo_refeicao": 60}'),
        (company_uuid, 'Escala 6x1 (Flexível)', 'flexivel_6x1', 6, 1, 7, '6 dias de trabalho, 1 dia de folga (não consecutivos)', '{"max_horas_diarias": 8, "max_horas_semanais": 44, "intervalo_refeicao": 60}'),
        (company_uuid, 'Escala 12x36', 'escala_12x36', 1, 2, 3, '12 horas de trabalho, 36 horas de folga', '{"max_horas_diarias": 12, "max_horas_semanais": 44, "intervalo_refeicao": 60}'),
        (company_uuid, 'Escala 24x48', 'escala_24x48', 1, 2, 3, '24 horas de trabalho, 48 horas de folga', '{"max_horas_diarias": 24, "max_horas_semanais": 44, "intervalo_refeicao": 60}')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 12. RLS Policies para novas tabelas
ALTER TABLE rh.work_shift_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.work_shift_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para work_shift_patterns
CREATE POLICY "Users can view work shift patterns from their company" 
    ON rh.work_shift_patterns FOR SELECT 
    USING (
        work_shift_id IN (
            SELECT id FROM rh.work_shifts 
            WHERE company_id IN (
                SELECT id FROM core.companies 
                WHERE id IN (
                    SELECT company_id FROM core.users 
                    WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage work shift patterns from their company" 
    ON rh.work_shift_patterns FOR ALL 
    USING (
        work_shift_id IN (
            SELECT id FROM rh.work_shifts 
            WHERE company_id IN (
                SELECT id FROM core.companies 
                WHERE id IN (
                    SELECT company_id FROM core.users 
                    WHERE id = auth.uid()
                )
            )
        )
    );

-- Políticas para work_shift_templates
CREATE POLICY "Users can view work shift templates from their company" 
    ON rh.work_shift_templates FOR SELECT 
    USING (
        company_id IN (
            SELECT id FROM core.companies 
            WHERE id IN (
                SELECT company_id FROM core.users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage work shift templates from their company" 
    ON rh.work_shift_templates FOR ALL 
    USING (
        company_id IN (
            SELECT id FROM core.companies 
            WHERE id IN (
                SELECT company_id FROM core.users 
                WHERE id = auth.uid()
            )
        )
    );

-- 13. Comentários
COMMENT ON TABLE rh.work_shift_patterns IS 'Padrões de trabalho para escalas flexíveis';
COMMENT ON TABLE rh.work_shift_templates IS 'Templates de escalas de trabalho';
COMMENT ON FUNCTION rh.validate_clt_compliance IS 'Valida se a escala está em conformidade com a CLT';
COMMENT ON FUNCTION rh.generate_flexible_schedule_pattern IS 'Gera padrão de escala flexível';
