-- Corrigir numeração dos relatórios
-- Data: 2025-01-15
-- Descrição: Adiciona números sequenciais aos relatórios que não possuem report_number

-- Adicionar campo report_number se não existir
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS report_number INTEGER;

-- Criar sequência para report_number se não existir
CREATE SEQUENCE IF NOT EXISTS reports_report_number_seq;

-- Atualizar relatórios que não têm report_number
-- Ordenar por created_at para manter a sequência cronológica
UPDATE public.reports 
SET report_number = nextval('reports_report_number_seq')
WHERE report_number IS NULL
ORDER BY created_at ASC;

-- Definir o valor atual da sequência para o próximo número
SELECT setval('reports_report_number_seq', COALESCE((SELECT MAX(report_number) FROM public.reports), 0) + 1);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_reports_report_number ON public.reports(report_number);

-- Comentário para documentar o campo
COMMENT ON COLUMN public.reports.report_number IS 'Número sequencial único do relatório (usado para identificação REL-XXX)'; 