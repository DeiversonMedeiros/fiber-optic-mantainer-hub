-- =====================================================
-- SISTEMA DE ESCALAS REORGANIZADO
-- =====================================================

-- 1. Tabela de Feriados (por cidade/estado)
CREATE TABLE IF NOT EXISTS rh.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID NULL,
  data DATE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('nacional', 'estadual', 'municipal')),
  estado TEXT NULL,
  cidade TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT holidays_pkey PRIMARY KEY (id),
  CONSTRAINT holidays_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id)
) TABLESPACE pg_default;

-- 2. Tabela de Entradas de Escala (programação visual)
CREATE TABLE IF NOT EXISTS rh.schedule_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('turno', 'folga', 'ferias', 'feriado', 'atestado', 'falta')),
  shift_id UUID NULL, -- referência ao turno quando tipo = 'turno'
  observacoes TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT schedule_entries_pkey PRIMARY KEY (id),
  CONSTRAINT schedule_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id),
  CONSTRAINT schedule_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES rh.employees (id),
  CONSTRAINT schedule_entries_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES rh.work_shifts (id),
  CONSTRAINT schedule_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES core.users (id),
  CONSTRAINT schedule_entries_unique_employee_date UNIQUE (employee_id, data)
) TABLESPACE pg_default;

-- 3. Adicionar coluna dias_semana na tabela work_shifts se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'rh' 
                   AND table_name = 'work_shifts' 
                   AND column_name = 'dias_semana') THEN
        ALTER TABLE rh.work_shifts ADD COLUMN dias_semana INTEGER[];
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_holidays_company_data ON rh.holidays (company_id, data) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_holidays_tipo ON rh.holidays (tipo) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_holidays_estado_cidade ON rh.holidays (estado, cidade) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_schedule_entries_company ON rh.schedule_entries (company_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_schedule_entries_employee ON rh.schedule_entries (employee_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_schedule_entries_data ON rh.schedule_entries (data) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_schedule_entries_tipo ON rh.schedule_entries (tipo) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_schedule_entries_employee_data ON rh.schedule_entries (employee_id, data) TABLESPACE pg_default;

-- RLS Policies
ALTER TABLE rh.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.schedule_entries ENABLE ROW LEVEL SECURITY;

-- Política para holidays
CREATE POLICY "Users can view holidays from their company" ON rh.holidays
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM core.user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert holidays for their company" ON rh.holidays
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM core.user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update holidays from their company" ON rh.holidays
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM core.user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete holidays from their company" ON rh.holidays
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM core.user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Política para schedule_entries
CREATE POLICY "Users can view schedule entries from their company" ON rh.schedule_entries
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM core.user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert schedule entries for their company" ON rh.schedule_entries
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM core.user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update schedule entries from their company" ON rh.schedule_entries
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM core.user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete schedule entries from their company" ON rh.schedule_entries
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM core.user_companies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Função para popular feriados nacionais brasileiros
CREATE OR REPLACE FUNCTION public.populate_national_holidays(company_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Feriados nacionais fixos
  INSERT INTO rh.holidays (company_id, data, nome, tipo, is_active) VALUES
  (company_uuid, '2024-01-01', 'Confraternização Universal', 'nacional', true),
  (company_uuid, '2024-04-21', 'Tiradentes', 'nacional', true),
  (company_uuid, '2024-05-01', 'Dia do Trabalhador', 'nacional', true),
  (company_uuid, '2024-09-07', 'Independência do Brasil', 'nacional', true),
  (company_uuid, '2024-10-12', 'Nossa Senhora Aparecida', 'nacional', true),
  (company_uuid, '2024-11-02', 'Finados', 'nacional', true),
  (company_uuid, '2024-11-15', 'Proclamação da República', 'nacional', true),
  (company_uuid, '2024-12-25', 'Natal', 'nacional', true),
  
  -- 2025
  (company_uuid, '2025-01-01', 'Confraternização Universal', 'nacional', true),
  (company_uuid, '2025-04-21', 'Tiradentes', 'nacional', true),
  (company_uuid, '2025-05-01', 'Dia do Trabalhador', 'nacional', true),
  (company_uuid, '2025-09-07', 'Independência do Brasil', 'nacional', true),
  (company_uuid, '2025-10-12', 'Nossa Senhora Aparecida', 'nacional', true),
  (company_uuid, '2025-11-02', 'Finados', 'nacional', true),
  (company_uuid, '2025-11-15', 'Proclamação da República', 'nacional', true),
  (company_uuid, '2025-12-25', 'Natal', 'nacional', true)
  
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular feriados móveis (Páscoa)
CREATE OR REPLACE FUNCTION public.calculate_easter(year INTEGER)
RETURNS DATE AS $$
DECLARE
  a INTEGER;
  b INTEGER;
  c INTEGER;
  d INTEGER;
  e INTEGER;
  f INTEGER;
  g INTEGER;
  h INTEGER;
  i INTEGER;
  k INTEGER;
  l INTEGER;
  m INTEGER;
  month INTEGER;
  day INTEGER;
BEGIN
  a := year % 19;
  b := year / 100;
  c := year % 100;
  d := b / 4;
  e := b % 4;
  f := (b + 8) / 25;
  g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30;
  i := c / 4;
  k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  month := (h + l - 7 * m + 114) / 31;
  day := ((h + l - 7 * m + 114) % 31) + 1;
  
  RETURN make_date(year, month, day);
END;
$$ LANGUAGE plpgsql;

-- Função para popular feriados móveis
CREATE OR REPLACE FUNCTION public.populate_mobile_holidays(company_uuid UUID, year_val INTEGER)
RETURNS VOID AS $$
DECLARE
  easter_date DATE;
  carnival_date DATE;
  corpus_christi_date DATE;
  good_friday_date DATE;
BEGIN
  easter_date := public.calculate_easter(year_val);
  carnival_date := easter_date - INTERVAL '47 days';
  corpus_christi_date := easter_date + INTERVAL '60 days';
  good_friday_date := easter_date - INTERVAL '2 days';
  
  -- Carnaval (segunda-feira)
  INSERT INTO rh.holidays (company_id, data, nome, tipo, is_active) VALUES
  (company_uuid, carnival_date, 'Carnaval', 'nacional', true),
  (company_uuid, carnival_date + INTERVAL '1 day', 'Carnaval', 'nacional', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Sexta-feira Santa
  INSERT INTO rh.holidays (company_id, data, nome, tipo, is_active) VALUES
  (company_uuid, good_friday_date, 'Sexta-feira Santa', 'nacional', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Corpus Christi
  INSERT INTO rh.holidays (company_id, data, nome, tipo, is_active) VALUES
  (company_uuid, corpus_christi_date, 'Corpus Christi', 'nacional', true)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE rh.holidays IS 'Tabela para gerenciar feriados nacionais, estaduais e municipais';
COMMENT ON TABLE rh.schedule_entries IS 'Tabela para programação visual de escalas (funcionário x dia)';
COMMENT ON COLUMN rh.schedule_entries.tipo IS 'Tipo de entrada: turno, folga, ferias, feriado, atestado, falta';
COMMENT ON COLUMN rh.holidays.tipo IS 'Tipo de feriado: nacional, estadual, municipal';
