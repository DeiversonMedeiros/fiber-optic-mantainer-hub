-- Alterar a tabela benefits para usar o enum do schema rh
-- Primeiro, verificar se o enum rh.tipo_beneficio_rh existe
SELECT unnest(enum_range(NULL::rh.tipo_beneficio_rh)) as rh_enum_values;

-- Alterar a coluna tipo da tabela benefits para usar o enum do schema rh
ALTER TABLE rh.benefits 
ALTER COLUMN tipo TYPE rh.tipo_beneficio_rh 
USING CASE 
  WHEN tipo::text = 'fixo' THEN 'VR'::rh.tipo_beneficio_rh
  WHEN tipo::text = 'percentual' THEN 'PLR'::rh.tipo_beneficio_rh
  WHEN tipo::text = 'flexivel' THEN 'outros'::rh.tipo_beneficio_rh
  ELSE 'outros'::rh.tipo_beneficio_rh
END;
