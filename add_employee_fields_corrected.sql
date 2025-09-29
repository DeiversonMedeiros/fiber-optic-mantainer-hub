-- Script completo para adicionar campos na tabela employees
-- Este script adiciona campos para controle de ponto, banco de horas, PCD e adicionais legais

-- =====================================================
-- 1. CAMPOS DE CONTROLE DE PONTO E BANCO DE HORAS
-- =====================================================

-- Adicionar campo para controlar se o funcionário precisa registrar ponto
ALTER TABLE rh.employees 
ADD COLUMN IF NOT EXISTS precisa_registrar_ponto boolean NOT NULL DEFAULT true;

-- Adicionar campo para tipo de banco de horas
ALTER TABLE rh.employees 
ADD COLUMN IF NOT EXISTS tipo_banco_horas text NULL DEFAULT 'compensatorio';

-- Adicionar constraint para validar os valores permitidos do banco de horas
ALTER TABLE rh.employees 
ADD CONSTRAINT IF NOT EXISTS check_tipo_banco_horas 
CHECK (tipo_banco_horas IN ('compensatorio', 'banco_horas', 'horas_extras', 'nao_aplicavel'));

-- =====================================================
-- 2. CAMPOS DE PCD (PESSOA COM DEFICIÊNCIA)
-- =====================================================

-- Adicionar campos de PCD
ALTER TABLE rh.employees 
ADD COLUMN IF NOT EXISTS is_pcd boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deficiency_type text NULL,
ADD COLUMN IF NOT EXISTS deficiency_degree text NULL;

-- Adicionar constraints para validar os valores de deficiência
ALTER TABLE rh.employees 
ADD CONSTRAINT IF NOT EXISTS check_deficiency_type 
CHECK (deficiency_type IN ('fisica', 'visual', 'auditiva', 'intelectual', 'mental', 'multipla') OR deficiency_type IS NULL);

ALTER TABLE rh.employees 
ADD CONSTRAINT IF NOT EXISTS check_deficiency_degree 
CHECK (deficiency_degree IN ('leve', 'moderada', 'severa', 'profunda') OR deficiency_degree IS NULL);

-- =====================================================
-- 3. CAMPOS DE ADICIONAIS LEGAIS (NÃO OPCIONAIS)
-- =====================================================

-- Adicionar campos de adicionais legais
-- Estes são calculados automaticamente baseados no registro de ponto
ALTER TABLE rh.employees 
ADD COLUMN IF NOT EXISTS periculosidade boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS insalubridade boolean NOT NULL DEFAULT false;

-- =====================================================
-- 4. COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON COLUMN rh.employees.precisa_registrar_ponto IS 'Indica se o funcionário precisa registrar ponto. Funções de liderança podem ter este campo como false.';
COMMENT ON COLUMN rh.employees.tipo_banco_horas IS 'Tipo de banco de horas: compensatorio, banco_horas, horas_extras, nao_aplicavel';
COMMENT ON COLUMN rh.employees.is_pcd IS 'Indica se o funcionário é pessoa com deficiência (PCD)';
COMMENT ON COLUMN rh.employees.deficiency_type IS 'Tipo de deficiência: fisica, visual, auditiva, intelectual, mental, multipla';
COMMENT ON COLUMN rh.employees.deficiency_degree IS 'Grau de deficiência: leve, moderada, severa, profunda';
COMMENT ON COLUMN rh.employees.periculosidade IS 'Indica se o funcionário trabalha em ambiente de periculosidade (adicional obrigatório)';
COMMENT ON COLUMN rh.employees.insalubridade IS 'Indica se o funcionário trabalha em ambiente insalubre (adicional obrigatório)';

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para campos de controle de ponto
CREATE INDEX IF NOT EXISTS idx_employees_precisa_registrar_ponto 
ON rh.employees (precisa_registrar_ponto) 
WHERE precisa_registrar_ponto = false;

CREATE INDEX IF NOT EXISTS idx_employees_tipo_banco_horas 
ON rh.employees (tipo_banco_horas);

-- Índices para campos de PCD
CREATE INDEX IF NOT EXISTS idx_employees_is_pcd 
ON rh.employees (is_pcd) 
WHERE is_pcd = true;

CREATE INDEX IF NOT EXISTS idx_employees_deficiency_type 
ON rh.employees (deficiency_type) 
WHERE deficiency_type IS NOT NULL;

-- Índices para adicionais legais
CREATE INDEX IF NOT EXISTS idx_employees_periculosidade 
ON rh.employees (periculosidade) 
WHERE periculosidade = true;

CREATE INDEX IF NOT EXISTS idx_employees_insalubridade 
ON rh.employees (insalubridade) 
WHERE insalubridade = true;

-- =====================================================
-- 6. ATUALIZAÇÃO DE DADOS EXISTENTES
-- =====================================================

-- Atualizar funcionários existentes para manter o comportamento atual
UPDATE rh.employees 
SET precisa_registrar_ponto = true 
WHERE precisa_registrar_ponto IS NULL;

UPDATE rh.employees 
SET tipo_banco_horas = 'compensatorio' 
WHERE tipo_banco_horas IS NULL;

UPDATE rh.employees 
SET is_pcd = false 
WHERE is_pcd IS NULL;

UPDATE rh.employees 
SET periculosidade = false 
WHERE periculosidade IS NULL;

UPDATE rh.employees 
SET insalubridade = false 
WHERE insalubridade IS NULL;

-- =====================================================
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as colunas foram criadas corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    CASE 
        WHEN column_name IN ('precisa_registrar_ponto', 'is_pcd', 'periculosidade', 'insalubridade') 
        THEN 'Controle/Obrigatório'
        WHEN column_name = 'tipo_banco_horas' 
        THEN 'Configuração de Trabalho'
        WHEN column_name IN ('deficiency_type', 'deficiency_degree') 
        THEN 'Informações PCD'
        ELSE 'Outro'
    END as categoria
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'employees' 
AND column_name IN (
    'precisa_registrar_ponto', 
    'tipo_banco_horas', 
    'is_pcd', 
    'deficiency_type', 
    'deficiency_degree', 
    'periculosidade', 
    'insalubridade'
)
ORDER BY 
    CASE 
        WHEN column_name IN ('precisa_registrar_ponto', 'is_pcd', 'periculosidade', 'insalubridade') THEN 1
        WHEN column_name = 'tipo_banco_horas' THEN 2
        WHEN column_name IN ('deficiency_type', 'deficiency_degree') THEN 3
        ELSE 4
    END,
    column_name;

-- =====================================================
-- 8. NOTA IMPORTANTE SOBRE ADICIONAIS NOTURNO E FDS
-- =====================================================

/*
IMPORTANTE: 
- Adicional noturno e adicional de final de semana são OBRIGAÇÕES LEGAIS
- Estes adicionais devem ser calculados automaticamente baseados no registro de ponto
- NÃO devem ser campos opcionais na tabela employees
- O cálculo deve ser feito na tabela time_records baseado nos horários trabalhados
- Horário noturno: 22h às 5h (adicional de 20%)
- Final de semana: sábados e domingos (adicional de 50% ou 100% dependendo da legislação)
*/

























