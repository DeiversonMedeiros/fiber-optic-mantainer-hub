-- =====================================================
-- SISTEMA DE FÉRIAS FRACIONADAS
-- Implementa a legislação brasileira para férias fracionadas
-- =====================================================

-- 1. Adicionar campos de fracionamento na tabela vacations
ALTER TABLE rh.vacations 
ADD COLUMN IF NOT EXISTS tipo_fracionamento TEXT DEFAULT 'integral' 
    CHECK (tipo_fracionamento IN ('integral', 'fracionado')),
ADD COLUMN IF NOT EXISTS total_periodos INTEGER DEFAULT 1 
    CHECK (total_periodos >= 1 AND total_periodos <= 3),
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES core.users(id),
ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP WITH TIME ZONE;

-- 2. Criar tabela para períodos de férias fracionadas
CREATE TABLE IF NOT EXISTS rh.vacation_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacation_id UUID NOT NULL REFERENCES rh.vacations(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    dias_ferias INTEGER NOT NULL CHECK (dias_ferias > 0),
    dias_abono INTEGER DEFAULT 0 CHECK (dias_abono >= 0),
    periodo_numero INTEGER NOT NULL CHECK (periodo_numero >= 1 AND periodo_numero <= 3),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraint para garantir que não há sobreposição de períodos
    CONSTRAINT check_no_overlap EXCLUDE USING gist (
        vacation_id WITH =,
        daterange(data_inicio, data_fim, '[]') WITH &&
    )
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_vacation_periods_vacation_id 
    ON rh.vacation_periods(vacation_id);
CREATE INDEX IF NOT EXISTS idx_vacation_periods_dates 
    ON rh.vacation_periods(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_vacations_fracionamento 
    ON rh.vacations(tipo_fracionamento, total_periodos);

-- 4. Função para validar férias fracionadas conforme legislação
CREATE OR REPLACE FUNCTION rh.validar_ferias_fracionadas(
    p_employee_id UUID,
    p_periodos JSONB
) RETURNS TABLE(
    valido BOOLEAN,
    mensagem TEXT,
    total_dias INTEGER,
    tem_periodo_14_dias BOOLEAN
) AS $$
DECLARE
    total_dias INTEGER := 0;
    periodo JSONB;
    dias_periodo INTEGER;
    tem_periodo_14_dias BOOLEAN := FALSE;
    num_periodos INTEGER;
    i INTEGER;
BEGIN
    -- Validar entrada
    IF p_periodos IS NULL OR jsonb_array_length(p_periodos) = 0 THEN
        RETURN QUERY SELECT FALSE, 'Nenhum período fornecido', 0, FALSE;
        RETURN;
    END IF;
    
    num_periodos := jsonb_array_length(p_periodos);
    
    -- Validar máximo 3 períodos
    IF num_periodos > 3 THEN
        RETURN QUERY SELECT FALSE, 'Máximo de 3 períodos permitidos', 0, FALSE;
        RETURN;
    END IF;
    
    -- Validar cada período
    FOR i IN 0..num_periodos-1
    LOOP
        periodo := p_periodos->i;
        dias_periodo := COALESCE((periodo->>'dias_ferias')::INTEGER, 0);
        
        -- Validar dias do período
        IF dias_periodo < 5 THEN
            RETURN QUERY SELECT FALSE, 'Cada período deve ter no mínimo 5 dias', 0, FALSE;
            RETURN;
        END IF;
        
        total_dias := total_dias + dias_periodo;
        
        -- Verificar se tem pelo menos um período com 14+ dias
        IF dias_periodo >= 14 THEN
            tem_periodo_14_dias := TRUE;
        END IF;
    END LOOP;
    
    -- Validar total de dias (máximo 30)
    IF total_dias > 30 THEN
        RETURN QUERY SELECT FALSE, 'Total de dias não pode exceder 30', total_dias, tem_periodo_14_dias;
        RETURN;
    END IF;
    
    -- Deve ter pelo menos um período com 14+ dias
    IF NOT tem_periodo_14_dias THEN
        RETURN QUERY SELECT FALSE, 'Pelo menos um período deve ter 14 dias ou mais', total_dias, FALSE;
        RETURN;
    END IF;
    
    -- Validar se funcionário tem direito a férias
    IF NOT EXISTS (
        SELECT 1 FROM rh.calcular_direito_ferias(p_employee_id) 
        WHERE tem_direito = TRUE
    ) THEN
        RETURN QUERY SELECT FALSE, 'Funcionário não tem direito a férias no momento', total_dias, tem_periodo_14_dias;
        RETURN;
    END IF;
    
    -- Tudo válido
    RETURN QUERY SELECT TRUE, 'Férias fracionadas válidas', total_dias, tem_periodo_14_dias;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para criar férias fracionadas
CREATE OR REPLACE FUNCTION rh.criar_ferias_fracionadas(
    p_company_id UUID,
    p_employee_id UUID,
    p_ano INTEGER,
    p_periodos JSONB,
    p_observacoes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_vacation_id UUID;
    v_validation RECORD;
    periodo JSONB;
    i INTEGER;
    num_periodos INTEGER;
BEGIN
    -- Validar férias fracionadas
    SELECT * INTO v_validation 
    FROM rh.validar_ferias_fracionadas(p_employee_id, p_periodos);
    
    IF NOT v_validation.valido THEN
        RAISE EXCEPTION 'Erro de validação: %', v_validation.mensagem;
    END IF;
    
    num_periodos := jsonb_array_length(p_periodos);
    
    -- Criar registro principal de férias
    INSERT INTO rh.vacations (
        company_id,
        employee_id,
        ano,
        periodo,
        tipo_fracionamento,
        total_periodos,
        observacoes,
        status
    ) VALUES (
        p_company_id,
        p_employee_id,
        p_ano,
        'Férias Fracionadas',
        'fracionado',
        num_periodos,
        p_observacoes,
        'solicitado'
    ) RETURNING id INTO v_vacation_id;
    
    -- Criar períodos individuais
    FOR i IN 0..num_periodos-1
    LOOP
        periodo := p_periodos->i;
        
        INSERT INTO rh.vacation_periods (
            vacation_id,
            data_inicio,
            data_fim,
            dias_ferias,
            dias_abono,
            periodo_numero,
            observacoes
        ) VALUES (
            v_vacation_id,
            (periodo->>'data_inicio')::DATE,
            (periodo->>'data_fim')::DATE,
            (periodo->>'dias_ferias')::INTEGER,
            COALESCE((periodo->>'dias_abono')::INTEGER, 0),
            i + 1,
            periodo->>'observacoes'
        );
    END LOOP;
    
    RETURN v_vacation_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para buscar férias com períodos
CREATE OR REPLACE FUNCTION rh.buscar_ferias_com_periodos(
    p_vacation_id UUID
) RETURNS TABLE(
    vacation_id UUID,
    company_id UUID,
    employee_id UUID,
    ano INTEGER,
    periodo TEXT,
    tipo_fracionamento TEXT,
    total_periodos INTEGER,
    status TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    aprovado_por UUID,
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    periodos JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.company_id,
        v.employee_id,
        v.ano,
        v.periodo,
        v.tipo_fracionamento,
        v.total_periodos,
        v.status::TEXT,
        v.observacoes,
        v.created_at,
        v.aprovado_por,
        v.data_aprovacao,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', vp.id,
                    'data_inicio', vp.data_inicio,
                    'data_fim', vp.data_fim,
                    'dias_ferias', vp.dias_ferias,
                    'dias_abono', vp.dias_abono,
                    'periodo_numero', vp.periodo_numero,
                    'observacoes', vp.observacoes
                ) ORDER BY vp.periodo_numero
            ) FILTER (WHERE vp.id IS NOT NULL),
            '[]'::jsonb
        ) as periodos
    FROM rh.vacations v
    LEFT JOIN rh.vacation_periods vp ON v.id = vp.vacation_id
    WHERE v.id = p_vacation_id
    GROUP BY v.id, v.company_id, v.employee_id, v.ano, v.periodo, 
             v.tipo_fracionamento, v.total_periodos, v.status, 
             v.observacoes, v.created_at, v.aprovado_por, v.data_aprovacao;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para aprovar férias fracionadas
CREATE OR REPLACE FUNCTION rh.aprovar_ferias_fracionadas(
    p_vacation_id UUID,
    p_aprovado_por UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_vacation RECORD;
BEGIN
    -- Buscar dados da férias
    SELECT * INTO v_vacation 
    FROM rh.vacations 
    WHERE id = p_vacation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Férias não encontradas';
    END IF;
    
    IF v_vacation.status != 'solicitado' THEN
        RAISE EXCEPTION 'Apenas férias solicitadas podem ser aprovadas';
    END IF;
    
    -- Atualizar status
    UPDATE rh.vacations 
    SET 
        status = 'aprovado',
        aprovado_por = p_aprovado_por,
        data_aprovacao = now()
    WHERE id = p_vacation_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION rh.update_vacation_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vacation_periods_updated_at
    BEFORE UPDATE ON rh.vacation_periods
    FOR EACH ROW
    EXECUTE FUNCTION rh.update_vacation_periods_updated_at();

-- 9. Políticas RLS para vacation_periods
ALTER TABLE rh.vacation_periods ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem seus próprios períodos
CREATE POLICY "Users can view their own vacation periods" ON rh.vacation_periods
    FOR SELECT USING (
        vacation_id IN (
            SELECT id FROM rh.vacations 
            WHERE employee_id = auth.uid()
        )
    );

-- Política para usuários autenticados inserirem seus próprios períodos
CREATE POLICY "Users can insert their own vacation periods" ON rh.vacation_periods
    FOR INSERT WITH CHECK (
        vacation_id IN (
            SELECT id FROM rh.vacations 
            WHERE employee_id = auth.uid()
        )
    );

-- Política para usuários autenticados atualizarem seus próprios períodos
CREATE POLICY "Users can update their own vacation periods" ON rh.vacation_periods
    FOR UPDATE USING (
        vacation_id IN (
            SELECT id FROM rh.vacations 
            WHERE employee_id = auth.uid()
        )
    );

-- Política para usuários autenticados deletarem seus próprios períodos
CREATE POLICY "Users can delete their own vacation periods" ON rh.vacation_periods
    FOR DELETE USING (
        vacation_id IN (
            SELECT id FROM rh.vacations 
            WHERE employee_id = auth.uid()
        )
    );

-- 10. Comentários para documentação
COMMENT ON TABLE rh.vacation_periods IS 'Períodos individuais de férias fracionadas conforme legislação brasileira';
COMMENT ON COLUMN rh.vacation_periods.periodo_numero IS 'Número do período (1, 2 ou 3)';
COMMENT ON FUNCTION rh.validar_ferias_fracionadas IS 'Valida férias fracionadas conforme legislação brasileira (máximo 3 períodos, um com 14+ dias, demais com 5+ dias)';
COMMENT ON FUNCTION rh.criar_ferias_fracionadas IS 'Cria férias fracionadas com validação automática';
COMMENT ON FUNCTION rh.buscar_ferias_com_periodos IS 'Busca férias com todos os períodos associados em formato JSON';
COMMENT ON FUNCTION rh.aprovar_ferias_fracionadas IS 'Aprova férias fracionadas e registra dados de aprovação';











