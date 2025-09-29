-- Script para adicionar campo de controle de registro de ponto na tabela employees
-- Este campo permite habilitar/desabilitar a necessidade de registrar ponto para funções de liderança

-- Adicionar campo para controlar se o funcionário precisa registrar ponto
ALTER TABLE rh.employees 
ADD COLUMN IF NOT EXISTS precisa_registrar_ponto boolean NOT NULL DEFAULT true;

-- Adicionar comentário explicativo
COMMENT ON COLUMN rh.employees.precisa_registrar_ponto IS 'Indica se o funcionário precisa registrar ponto. Funções de liderança podem ter este campo como false.';

-- Atualizar funcionários existentes para manter o comportamento atual (todos precisam registrar ponto)
UPDATE rh.employees 
SET precisa_registrar_ponto = true 
WHERE precisa_registrar_ponto IS NULL;

-- Criar índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_employees_precisa_registrar_ponto 
ON rh.employees (precisa_registrar_ponto) 
WHERE precisa_registrar_ponto = false;

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'employees' 
AND column_name = 'precisa_registrar_ponto';



























