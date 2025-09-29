-- =====================================================
-- TESTE DAS FUNÇÕES DE FERIADOS
-- =====================================================

-- Substitua este UUID pelo ID real de uma empresa do seu sistema
-- Exemplo: '123e4567-e89b-12d3-a456-426614174000'
DO $$
DECLARE
  test_company_id UUID := '123e4567-e89b-12d3-a456-426614174000'; -- SUBSTITUA PELO ID REAL DA EMPRESA
BEGIN
  -- Testar função de feriados nacionais
  RAISE NOTICE 'Testando populate_national_holidays...';
  PERFORM public.populate_national_holidays(test_company_id);
  
  -- Testar função de feriados móveis para 2024
  RAISE NOTICE 'Testando populate_mobile_holidays para 2024...';
  PERFORM public.populate_mobile_holidays(test_company_id, 2024);
  
  -- Testar função de feriados móveis para 2025
  RAISE NOTICE 'Testando populate_mobile_holidays para 2025...';
  PERFORM public.populate_mobile_holidays(test_company_id, 2025);
  
  RAISE NOTICE 'Testes concluídos com sucesso!';
END $$;

-- Verificar quantos feriados foram inseridos
SELECT 
  COUNT(*) as total_feriados,
  COUNT(CASE WHEN tipo = 'nacional' THEN 1 END) as feriados_nacionais,
  COUNT(CASE WHEN data >= '2024-01-01' AND data < '2025-01-01' THEN 1 END) as feriados_2024,
  COUNT(CASE WHEN data >= '2025-01-01' AND data < '2026-01-01' THEN 1 END) as feriados_2025
FROM rh.holidays 
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000'; -- SUBSTITUA PELO ID REAL DA EMPRESA

-- Listar alguns feriados inseridos
SELECT 
  data,
  nome,
  tipo,
  CASE 
    WHEN EXTRACT(DOW FROM data) = 0 THEN 'Domingo'
    WHEN EXTRACT(DOW FROM data) = 6 THEN 'Sábado'
    ELSE 'Dia útil'
  END as dia_semana
FROM rh.holidays 
WHERE company_id = '123e4567-e89b-12d3-a456-426614174000' -- SUBSTITUA PELO ID REAL DA EMPRESA
ORDER BY data
LIMIT 20;











