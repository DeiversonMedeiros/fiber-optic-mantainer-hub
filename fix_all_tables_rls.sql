-- =====================================================
-- HABILITAR RLS E CRIAR POLÍTICAS PARA TODAS AS TABELAS
-- =====================================================

-- Tabela delay_reasons
ALTER TABLE rh.delay_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para usuários autenticados" ON rh.delay_reasons
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON rh.delay_reasons
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON rh.delay_reasons
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON rh.delay_reasons
    FOR DELETE TO authenticated USING (true);

-- Tabela cid_codes
ALTER TABLE rh.cid_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para usuários autenticados" ON rh.cid_codes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON rh.cid_codes
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON rh.cid_codes
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON rh.cid_codes
    FOR DELETE TO authenticated USING (true);

-- Tabela absence_types
ALTER TABLE rh.absence_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para usuários autenticados" ON rh.absence_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON rh.absence_types
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON rh.absence_types
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON rh.absence_types
    FOR DELETE TO authenticated USING (true);

-- Tabela allowance_types
ALTER TABLE rh.allowance_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para usuários autenticados" ON rh.allowance_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON rh.allowance_types
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON rh.allowance_types
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON rh.allowance_types
    FOR DELETE TO authenticated USING (true);

-- Tabela inss_brackets
ALTER TABLE rh.inss_brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para usuários autenticados" ON rh.inss_brackets
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON rh.inss_brackets
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON rh.inss_brackets
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON rh.inss_brackets
    FOR DELETE TO authenticated USING (true);

-- Tabela irrf_brackets
ALTER TABLE rh.irrf_brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para usuários autenticados" ON rh.irrf_brackets
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON rh.irrf_brackets
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON rh.irrf_brackets
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON rh.irrf_brackets
    FOR DELETE TO authenticated USING (true);

-- Tabela fgts_config
ALTER TABLE rh.fgts_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para usuários autenticados" ON rh.fgts_config
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON rh.fgts_config
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON rh.fgts_config
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON rh.fgts_config
    FOR DELETE TO authenticated USING (true);































































