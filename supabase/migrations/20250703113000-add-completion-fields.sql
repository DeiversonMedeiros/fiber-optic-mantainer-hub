-- Adicionar campos de conclusão à tabela preventive_schedule
ALTER TABLE public.preventive_schedule 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance de consultas por status de conclusão
CREATE INDEX IF NOT EXISTS idx_preventive_schedule_completion 
ON public.preventive_schedule(is_completed, completed_at);

-- Atualizar política RLS para permitir que inspetores marquem suas vistorias como concluídas
CREATE POLICY "Inspectors can update their own schedule completion"
ON public.preventive_schedule FOR UPDATE
USING (
  inspector_id = auth.uid() OR
  public.is_admin_or_manager_safe()
); 

-- Adiciona o campo assigned_to na tabela reports para adequação
ALTER TABLE reports ADD COLUMN assigned_to uuid REFERENCES profiles(id); 