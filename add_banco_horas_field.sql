-- Script para adicionar campo de tipo de banco de horas na tabela employees
-- Este campo permite definir como o funcionário trabalha com horas extras e compensação

-- Adicionar campo para tipo de banco de horas
ALTER TABLE rh.employees 
ADD COLUMN IF NOT EXISTS tipo_banco_horas text NULL DEFAULT 'compensatorio';

-- Adicionar constraint para validar os valores permitidos
ALTER TABLE rh.employees 
ADD CONSTRAINT IF NOT EXISTS check_tipo_banco_horas 
CHECK (tipo_banco_horas IN ('compensatorio', 'banco_horas', 'horas_extras', 'nao_aplicavel'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN rh.employees.tipo_banco_horas IS 'Tipo de banco de horas: compensatorio, banco_horas, horas_extras, nao_aplicavel';

-- Atualizar funcionários existentes para manter o comportamento atual (compensatório)
UPDATE rh.employees 
SET tipo_banco_horas = 'compensatorio' 
WHERE tipo_banco_horas IS NULL;

-- Criar índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_employees_tipo_banco_horas 
ON rh.employees (tipo_banco_horas);

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'employees' 
AND column_name = 'tipo_banco_horas';

























