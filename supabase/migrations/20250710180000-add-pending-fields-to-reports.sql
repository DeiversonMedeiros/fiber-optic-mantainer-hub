-- Adiciona campos de pendência para relatórios
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS pending_reason TEXT,
ADD COLUMN IF NOT EXISTS pending_notes TEXT; 