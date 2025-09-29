-- Script para implementar cálculo automático de adicionais noturno e final de semana
-- Estes adicionais são obrigações legais calculadas automaticamente baseadas no registro de ponto

-- =====================================================
-- 1. ADICIONAR CAMPOS DE CÁLCULO AUTOMÁTICO NA TABELA TIME_RECORDS
-- =====================================================

-- Adicionar campos para armazenar os cálculos automáticos
ALTER TABLE rh.time_records 
ADD COLUMN IF NOT EXISTS horas_noturnas numeric(4,2) NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_final_semana numeric(4,2) NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_adicional_noturno numeric(10,2) NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_adicional_final_semana numeric(10,2) NULL DEFAULT 0;

-- Adicionar comentários explicativos
COMMENT ON COLUMN rh.time_records.horas_noturnas IS 'Quantidade de horas trabalhadas no período noturno (22h às 5h)';
COMMENT ON COLUMN rh.time_records.horas_final_semana IS 'Quantidade de horas trabalhadas em final de semana (sábado e domingo)';
COMMENT ON COLUMN rh.time_records.valor_adicional_noturno IS 'Valor do adicional noturno calculado automaticamente (20% sobre as horas noturnas)';
COMMENT ON COLUMN rh.time_records.valor_adicional_final_semana IS 'Valor do adicional de final de semana calculado automaticamente (50% ou 100% sobre as horas de FDS)';

-- =====================================================
-- 2. FUNÇÃO PARA CALCULAR ADICIONAIS AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION rh.calcular_adicionais_automaticos()
RETURNS TRIGGER AS $$
DECLARE
    hora_inicio time;
    hora_fim time;
    data_trabalho date;
    dia_semana integer;
    horas_trabalhadas numeric(4,2);
    horas_noturnas numeric(4,2) := 0;
    horas_fds numeric(4,2) := 0;
    salario_hora numeric(10,2);
    valor_adicional_noturno numeric(10,2) := 0;
    valor_adicional_final_semana numeric(10,2) := 0;
BEGIN
    -- Verificar se temos os dados necessários
    IF NEW.hora_entrada IS NULL OR NEW.hora_saida IS NULL OR NEW.data IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Obter dados do funcionário para calcular salário por hora
    SELECT salario_base INTO salario_hora
    FROM rh.employees 
    WHERE id = NEW.employee_id;
    
    -- Se não tiver salário base, não calcula adicionais
    IF salario_hora IS NULL OR salario_hora <= 0 THEN
        RETURN NEW;
    END IF;
    
    -- Calcular salário por hora (considerando 220 horas por mês)
    salario_hora := salario_hora / 220;
    
    -- Obter dados do registro
    hora_inicio := NEW.hora_entrada;
    hora_fim := NEW.hora_saida;
    data_trabalho := NEW.data;
    dia_semana := EXTRACT(DOW FROM data_trabalho); -- 0 = domingo, 6 = sábado
    
    -- Calcular horas trabalhadas
    horas_trabalhadas := EXTRACT(EPOCH FROM (hora_fim - hora_inicio)) / 3600;
    
    -- Calcular horas noturnas (22h às 5h)
    IF hora_inicio < '05:00'::time THEN
        -- Trabalho que começa antes das 5h
        IF hora_fim <= '05:00'::time THEN
            -- Trabalho inteiro no período noturno
            horas_noturnas := horas_trabalhadas;
        ELSE
            -- Trabalho que vai até depois das 5h
            horas_noturnas := EXTRACT(EPOCH FROM ('05:00'::time - hora_inicio)) / 3600;
        END IF;
    ELSIF hora_inicio >= '22:00'::time THEN
        -- Trabalho que começa após 22h
        IF hora_fim <= '05:00'::time THEN
            -- Trabalho inteiro no período noturno
            horas_noturnas := horas_trabalhadas;
        ELSE
            -- Trabalho que vai até depois das 5h do dia seguinte
            horas_noturnas := EXTRACT(EPOCH FROM (hora_fim - hora_inicio)) / 3600;
        END IF;
    ELSIF hora_inicio < '22:00'::time AND hora_fim > '22:00'::time THEN
        -- Trabalho que começa antes das 22h e vai até depois das 22h
        horas_noturnas := EXTRACT(EPOCH FROM (hora_fim - '22:00'::time)) / 3600;
    END IF;
    
    -- Calcular horas de final de semana (sábado = 6, domingo = 0)
    IF dia_semana = 0 OR dia_semana = 6 THEN
        horas_fds := horas_trabalhadas;
    END IF;
    
    -- Calcular valores dos adicionais
    -- Adicional noturno: 20% sobre as horas noturnas
    valor_adicional_noturno := horas_noturnas * salario_hora * 0.20;
    
    -- Adicional final de semana: 50% sobre as horas de FDS (pode ser ajustado conforme legislação)
    valor_adicional_final_semana := horas_fds * salario_hora * 0.50;
    
    -- Atualizar os campos calculados
    NEW.horas_noturnas := ROUND(horas_noturnas, 2);
    NEW.horas_final_semana := ROUND(horas_fds, 2);
    NEW.valor_adicional_noturno := ROUND(valor_adicional_noturno, 2);
    NEW.valor_adicional_final_semana := ROUND(valor_adicional_final_semana, 2);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CRIAR TRIGGER PARA CALCULAR ADICIONAIS AUTOMATICAMENTE
-- =====================================================

-- Trigger para calcular adicionais ao inserir ou atualizar registros de ponto
DROP TRIGGER IF EXISTS trigger_calcular_adicionais ON rh.time_records;

CREATE TRIGGER trigger_calcular_adicionais
    BEFORE INSERT OR UPDATE ON rh.time_records
    FOR EACH ROW
    EXECUTE FUNCTION rh.calcular_adicionais_automaticos();

-- =====================================================
-- 4. FUNÇÃO PARA RECALCULAR ADICIONAIS DE UM PERÍODO
-- =====================================================

CREATE OR REPLACE FUNCTION rh.recalcular_adicionais_periodo(
    p_employee_id uuid,
    p_data_inicio date,
    p_data_fim date
)
RETURNS void AS $$
BEGIN
    -- Recalcular adicionais para todos os registros do período
    UPDATE rh.time_records 
    SET 
        horas_noturnas = 0,
        horas_final_semana = 0,
        valor_adicional_noturno = 0,
        valor_adicional_final_semana = 0
    WHERE employee_id = p_employee_id
    AND data BETWEEN p_data_inicio AND p_data_fim;
    
    -- Disparar o trigger para recalcular
    UPDATE rh.time_records 
    SET hora_entrada = hora_entrada
    WHERE employee_id = p_employee_id
    AND data BETWEEN p_data_inicio AND p_data_fim
    AND hora_entrada IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas de adicionais
CREATE INDEX IF NOT EXISTS idx_time_records_horas_noturnas 
ON rh.time_records (horas_noturnas) 
WHERE horas_noturnas > 0;

CREATE INDEX IF NOT EXISTS idx_time_records_horas_final_semana 
ON rh.time_records (horas_final_semana) 
WHERE horas_final_semana > 0;

CREATE INDEX IF NOT EXISTS idx_time_records_adicional_noturno 
ON rh.time_records (valor_adicional_noturno) 
WHERE valor_adicional_noturno > 0;

CREATE INDEX IF NOT EXISTS idx_time_records_adicional_final_semana 
ON rh.time_records (valor_adicional_final_semana) 
WHERE valor_adicional_final_semana > 0;

-- =====================================================
-- 6. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se os campos foram adicionados corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'time_records' 
AND column_name IN (
    'horas_noturnas', 
    'horas_final_semana', 
    'valor_adicional_noturno', 
    'valor_adicional_final_semana'
)
ORDER BY column_name;

-- =====================================================
-- 7. NOTA IMPORTANTE
-- =====================================================

/*
IMPORTANTE: 
- Os adicionais noturno e final de semana são calculados automaticamente
- Não são campos opcionais na tabela employees
- O cálculo é baseado nos horários de entrada e saída registrados
- Os percentuais podem ser ajustados conforme a legislação vigente
- A função recalcular_adicionais_periodo pode ser usada para recalcular períodos específicos
*/
