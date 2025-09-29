-- ============================================================================
-- MIGRAÇÃO: Adicionar campo logo_url na tabela companies
-- ============================================================================

-- Adicionar campo logo_url na tabela companies
ALTER TABLE core.companies 
ADD COLUMN logo_url TEXT;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN core.companies.logo_url IS 'URL da logo da empresa (pode ser um link externo ou caminho do Supabase Storage)';

-- Criar índice para melhorar performance em consultas que filtram por logo
CREATE INDEX IF NOT EXISTS idx_companies_logo_url ON core.companies(logo_url) WHERE logo_url IS NOT NULL;
