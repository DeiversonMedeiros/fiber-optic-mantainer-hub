-- Script para criar a tabela work_shifts no schema rh
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que o schema 'rh' existe
CREATE SCHEMA IF NOT EXISTS rh;

-- 2. Criar a tabela work_shifts
CREATE TABLE IF NOT EXISTS rh.work_shifts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    dias_semana INTEGER[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_work_shifts_company_id ON rh.work_shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_work_shifts_is_active ON rh.work_shifts(is_active);

-- 4. Conceder permissões na tabela
GRANT SELECT, INSERT, UPDATE, DELETE ON rh.work_shifts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON rh.work_shifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rh.work_shifts TO service_role;
GRANT ALL ON rh.work_shifts TO service_role;

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE rh.work_shifts ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
CREATE POLICY "Users can view work shifts from their company" 
    ON rh.work_shifts FOR SELECT 
    USING (
        company_id IN (
            SELECT id FROM core.companies 
            WHERE id IN (
                SELECT company_id FROM core.users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert work shifts for their company" 
    ON rh.work_shifts FOR INSERT 
    WITH CHECK (
        company_id IN (
            SELECT id FROM core.companies 
            WHERE id IN (
                SELECT company_id FROM core.users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update work shifts from their company" 
    ON rh.work_shifts FOR UPDATE 
    USING (
        company_id IN (
            SELECT id FROM core.companies 
            WHERE id IN (
                SELECT company_id FROM core.users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete work shifts from their company" 
    ON rh.work_shifts FOR DELETE 
    USING (
        company_id IN (
            SELECT id FROM core.companies 
            WHERE id IN (
                SELECT company_id FROM core.users 
                WHERE id = auth.uid()
            )
        )
    );

-- 7. Inserir dados de exemplo
INSERT INTO rh.work_shifts (company_id, nome, hora_inicio, hora_fim, dias_semana, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Turno Manhã', '08:00:00', '16:00:00', '{1,2,3,4,5}', true),
('550e8400-e29b-41d4-a716-446655440000', 'Turno Tarde', '14:00:00', '22:00:00', '{1,2,3,4,5}', true),
('550e8400-e29b-41d4-a716-446655440000', 'Turno Noite', '22:00:00', '06:00:00', '{1,2,3,4,5}', true);

-- 8. Verificar se a tabela foi criada corretamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'work_shifts'
ORDER BY ordinal_position;



































































