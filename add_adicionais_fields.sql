-- Script para adicionar campos de adicionais e complementos na tabela employees
-- Este script adiciona campos para periculosidade, insalubridade, adicionais noturno e final de semana

-- Adicionar campos de adicionais
ALTER TABLE rh.employees 
ADD COLUMN IF NOT EXISTS periculosidade boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS insalubridade boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS adicional_noturno boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS adicional_final_semana boolean NOT NULL DEFAULT false;

-- Adicionar comentários explicativos
COMMENT ON COLUMN rh.employees.periculosidade IS 'Indica se o funcionário tem direito ao adicional de periculosidade';
COMMENT ON COLUMN rh.employees.insalubridade IS 'Indica se o funcionário tem direito ao adicional de insalubridade';
COMMENT ON COLUMN rh.employees.adicional_noturno IS 'Indica se o funcionário tem direito ao adicional noturno';
COMMENT ON COLUMN rh.employees.adicional_final_semana IS 'Indica se o funcionário tem direito ao adicional de final de semana';

-- Criar índices para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_employees_periculosidade 
ON rh.employees (periculosidade) 
WHERE periculosidade = true;

CREATE INDEX IF NOT EXISTS idx_employees_insalubridade 
ON rh.employees (insalubridade) 
WHERE insalubridade = true;

CREATE INDEX IF NOT EXISTS idx_employees_adicional_noturno 
ON rh.employees (adicional_noturno) 
WHERE adicional_noturno = true;

CREATE INDEX IF NOT EXISTS idx_employees_adicional_final_semana 
ON rh.employees (adicional_final_semana) 
WHERE adicional_final_semana = true;

-- Verificar se as colunas foram criadas corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'employees' 
AND column_name IN ('periculosidade', 'insalubridade', 'adicional_noturno', 'adicional_final_semana')
ORDER BY column_name;

























