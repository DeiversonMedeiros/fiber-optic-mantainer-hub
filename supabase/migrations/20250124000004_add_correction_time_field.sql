-- ============================================================================
-- MIGRAÇÃO: ADICIONAR CAMPO DE HORÁRIO DA CORREÇÃO
-- ============================================================================
-- 
-- Data: 2025-01-24
-- Descrição: Adiciona campo 'horario_correcao' na tabela attendance_corrections
--           para registrar quando o funcionário fez a solicitação de correção
--
-- ============================================================================

-- Adicionar campo de horário da correção
ALTER TABLE rh.attendance_corrections 
ADD COLUMN IF NOT EXISTS horario_correcao TIMESTAMP WITH TIME ZONE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN rh.attendance_corrections.horario_correcao IS 
'Horário em que o funcionário fez a solicitação de correção de ponto';

-- Atualizar registros existentes (se houver) para usar o created_at como horário da correção
UPDATE rh.attendance_corrections 
SET horario_correcao = created_at 
WHERE horario_correcao IS NULL;
