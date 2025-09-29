-- =====================================================
-- FUNÇÕES PARA POPULAR FERIADOS NACIONAIS
-- =====================================================

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
  (company_uuid, '2025-12-25', 'Natal', 'nacional', true),
  
  -- 2026
  (company_uuid, '2026-01-01', 'Confraternização Universal', 'nacional', true),
  (company_uuid, '2026-04-21', 'Tiradentes', 'nacional', true),
  (company_uuid, '2026-05-01', 'Dia do Trabalhador', 'nacional', true),
  (company_uuid, '2026-09-07', 'Independência do Brasil', 'nacional', true),
  (company_uuid, '2026-10-12', 'Nossa Senhora Aparecida', 'nacional', true),
  (company_uuid, '2026-11-02', 'Finados', 'nacional', true),
  (company_uuid, '2026-11-15', 'Proclamação da República', 'nacional', true),
  (company_uuid, '2026-12-25', 'Natal', 'nacional', true)
  
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

-- Função para popular todos os feriados (fixos + móveis) para um ano
CREATE OR REPLACE FUNCTION public.populate_all_holidays_for_year(company_uuid UUID, year_val INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Popular feriados fixos
  PERFORM public.populate_national_holidays(company_uuid);
  
  -- Popular feriados móveis para o ano específico
  PERFORM public.populate_mobile_holidays(company_uuid, year_val);
END;
$$ LANGUAGE plpgsql;

-- Comentários das funções
COMMENT ON FUNCTION public.populate_national_holidays(UUID) IS 'Popula feriados nacionais brasileiros fixos para uma empresa';
COMMENT ON FUNCTION public.calculate_easter(INTEGER) IS 'Calcula a data da Páscoa para um ano específico';
COMMENT ON FUNCTION public.populate_mobile_holidays(UUID, INTEGER) IS 'Popula feriados móveis brasileiros (Carnaval, Sexta-feira Santa, Corpus Christi) para um ano específico';
COMMENT ON FUNCTION public.populate_all_holidays_for_year(UUID, INTEGER) IS 'Popula todos os feriados (fixos + móveis) para um ano específico';











