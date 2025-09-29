-- Criar enum para tipos de desconto
CREATE TYPE rh.tipo_desconto_rh AS ENUM (
  'multa_transito',
  'emprestimo',
  'avaria_equipamento',
  'perda_equipamento',
  'outros'
);

-- Criar enum para status de desconto
CREATE TYPE rh.status_desconto_rh AS ENUM (
  'ativo',
  'suspenso',
  'cancelado',
  'quitado'
);

-- Criar tabela de descontos de funcionários
CREATE TABLE rh.employee_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
  tipo_desconto rh.tipo_desconto_rh NOT NULL,
  descricao TEXT NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL CHECK (valor_total > 0),
  valor_parcela NUMERIC(10,2) NOT NULL CHECK (valor_parcela > 0),
  quantidade_parcelas INTEGER NOT NULL CHECK (quantidade_parcelas > 0),
  parcela_atual INTEGER NOT NULL DEFAULT 1 CHECK (parcela_atual > 0),
  data_inicio DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  status rh.status_desconto_rh NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  valor_maximo_parcela NUMERIC(10,2), -- Valor máximo calculado baseado em 30% do salário
  salario_base_funcionario NUMERIC(10,2), -- Salário base no momento da criação
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Criar índices para performance
CREATE INDEX idx_employee_discounts_employee_id ON rh.employee_discounts(employee_id);
CREATE INDEX idx_employee_discounts_company_id ON rh.employee_discounts(company_id);
CREATE INDEX idx_employee_discounts_status ON rh.employee_discounts(status);
CREATE INDEX idx_employee_discounts_data_inicio ON rh.employee_discounts(data_inicio);

-- Habilitar RLS
ALTER TABLE rh.employee_discounts ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view employee discounts" ON rh.employee_discounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rh.employees e
      WHERE e.id = employee_id
      AND e.company_id = (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert employee discounts" ON rh.employee_discounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM rh.employees e
      WHERE e.id = employee_id
      AND e.company_id = (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update employee discounts" ON rh.employee_discounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM rh.employees e
      WHERE e.id = employee_id
      AND e.company_id = (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete employee discounts" ON rh.employee_discounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM rh.employees e
      WHERE e.id = employee_id
      AND e.company_id = (SELECT company_id FROM core.user_companies WHERE user_id = auth.uid())
    )
  );

-- Criar função para calcular valor máximo da parcela (30% do salário base)
CREATE OR REPLACE FUNCTION rh.calculate_max_discount_installment(emp_id UUID)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  salario_base NUMERIC(10,2);
BEGIN
  SELECT salario_base INTO salario_base
  FROM rh.employees
  WHERE id = emp_id;
  
  IF salario_base IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN salario_base * 0.30;
END;
$$ LANGUAGE plpgsql;

-- Criar função para validar se o valor da parcela não excede 30% do salário
CREATE OR REPLACE FUNCTION rh.validate_discount_installment()
RETURNS TRIGGER AS $$
DECLARE
  max_installment NUMERIC(10,2);
  current_salary NUMERIC(10,2);
BEGIN
  -- Obter salário atual do funcionário
  SELECT salario_base INTO current_salary
  FROM rh.employees
  WHERE id = NEW.employee_id;
  
  -- Calcular valor máximo da parcela (30% do salário)
  max_installment := current_salary * 0.30;
  
  -- Atualizar o valor máximo calculado
  NEW.valor_maximo_parcela := max_installment;
  NEW.salario_base_funcionario := current_salary;
  
  -- Verificar se o valor da parcela excede o limite (apenas aviso, não bloqueia)
  IF NEW.valor_parcela > max_installment THEN
    RAISE WARNING 'Valor da parcela (R$ %) excede 30%% do salário base (R$ %). Valor máximo recomendado: R$ %', 
      NEW.valor_parcela, current_salary, max_installment;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar desconto
CREATE TRIGGER validate_discount_installment_trigger
  BEFORE INSERT OR UPDATE ON rh.employee_discounts
  FOR EACH ROW
  EXECUTE FUNCTION rh.validate_discount_installment();

-- Comentários na tabela
COMMENT ON TABLE rh.employee_discounts IS 'Tabela para controle de descontos de funcionários (multas, empréstimos, avarias, etc.)';
COMMENT ON COLUMN rh.employee_discounts.tipo_desconto IS 'Tipo do desconto: multa_transito, emprestimo, avaria_equipamento, perda_equipamento, outros';
COMMENT ON COLUMN rh.employee_discounts.valor_total IS 'Valor total do desconto';
COMMENT ON COLUMN rh.employee_discounts.valor_parcela IS 'Valor de cada parcela';
COMMENT ON COLUMN rh.employee_discounts.quantidade_parcelas IS 'Quantidade total de parcelas';
COMMENT ON COLUMN rh.employee_discounts.parcela_atual IS 'Parcela atual sendo processada';
COMMENT ON COLUMN rh.employee_discounts.valor_maximo_parcela IS 'Valor máximo da parcela baseado em 30% do salário base';
COMMENT ON COLUMN rh.employee_discounts.salario_base_funcionario IS 'Salário base do funcionário no momento da criação do desconto';
