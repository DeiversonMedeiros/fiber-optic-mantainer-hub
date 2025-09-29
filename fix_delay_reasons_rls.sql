-- Habilitar RLS na tabela delay_reasons
ALTER TABLE rh.delay_reasons ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados" ON rh.delay_reasons
    FOR SELECT
    TO authenticated
    USING (true);

-- Criar política para permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados" ON rh.delay_reasons
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Criar política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para usuários autenticados" ON rh.delay_reasons
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Criar política para permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão para usuários autenticados" ON rh.delay_reasons
    FOR DELETE
    TO authenticated
    USING (true);






























































