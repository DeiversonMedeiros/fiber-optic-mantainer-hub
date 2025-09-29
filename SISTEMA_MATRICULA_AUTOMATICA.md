# Sistema de Geração Automática de Matrícula para Funcionários

## 📋 Visão Geral

O sistema foi implementado para gerar automaticamente matrículas de funcionários seguindo o padrão especificado:

- **Empresa 01**: Funcionários recebem matrículas 010001, 010002, 010003...
- **Empresa 02**: Funcionários recebem matrículas 020001, 020002, 020003...
- **Empresa 03**: Funcionários recebem matrículas 030001, 030002, 030003...

## 🔧 Implementação Técnica

### Banco de Dados

#### 1. Campo `codigo_empresa` na tabela `core.companies`
```sql
ALTER TABLE core.companies ADD COLUMN codigo_empresa TEXT UNIQUE;
```

#### 2. Função de Geração de Matrícula
```sql
CREATE OR REPLACE FUNCTION rh.generate_employee_matricula(company_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    company_code TEXT;
    next_sequence INTEGER;
    generated_matricula TEXT;
BEGIN
    -- Obter o código da empresa
    SELECT codigo_empresa INTO company_code
    FROM core.companies WHERE id = company_id_param;
    
    -- Gerar próxima sequência
    SELECT COALESCE(MAX(CAST(SUBSTRING(matricula FROM 3 FOR 4) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM rh.employees
    WHERE matricula ~ ('^' || company_code || '[0-9]{4}$')
    AND company_id = company_id_param;
    
    -- Retornar matrícula no formato: [código_empresa][sequência_4_dígitos]
    RETURN company_code || LPAD(next_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

#### 3. Trigger Automático
```sql
CREATE TRIGGER trigger_set_employee_matricula
    BEFORE INSERT ON rh.employees
    FOR EACH ROW
    EXECUTE FUNCTION rh.set_employee_matricula();
```

## 🚀 Como Usar

### 1. Configurar Código da Empresa

Para cada empresa, defina um código único de 2 dígitos:

```sql
UPDATE core.companies SET codigo_empresa = '01' WHERE id = 'empresa-id-1';
UPDATE core.companies SET codigo_empresa = '02' WHERE id = 'empresa-id-2';
UPDATE core.companies SET codigo_empresa = '03' WHERE id = 'empresa-id-3';
```

### 2. Inserir Funcionários

Ao inserir um funcionário, a matrícula é gerada automaticamente:

```sql
INSERT INTO rh.employees (company_id, nome, cpf, data_admissao, status) 
VALUES ('empresa-id', 'Nome do Funcionário', '12345678901', CURRENT_DATE, 'ativo');
```

### 3. Interface de Usuário

Use o componente `CompanyCodeManager` para gerenciar códigos de empresas:

```tsx
import { CompanyCodeManager } from '@/components/rh/CompanyCodeManager';

<CompanyCodeManager 
  company={company} 
  onCodeUpdated={() => console.log('Código atualizado')} 
/>
```

## 📊 Exemplos de Resultados

### Empresa 01 (código: 01)
- João Silva → Matrícula: 010001
- Maria Santos → Matrícula: 010002
- Pedro Costa → Matrícula: 010003

### Empresa 02 (código: 02)
- Ana Lima → Matrícula: 020001
- Carlos Oliveira → Matrícula: 020002
- Fernanda Silva → Matrícula: 020003

## ⚠️ Considerações Importantes

1. **Códigos Únicos**: Cada empresa deve ter um código único de 2 dígitos (01-99)
2. **Sequência Automática**: A sequência é baseada na ordem de inserção dos funcionários
3. **Imutabilidade**: Matrículas existentes não são alteradas automaticamente
4. **Validação**: O sistema valida se a matrícula segue o padrão correto

## 🔄 Funções Auxiliares

### Reorganizar Matrículas Existentes
```sql
SELECT rh.reorganize_employee_matriculas();
```

### Gerar Próxima Matrícula (sem inserir)
```sql
SELECT rh.generate_employee_matricula('empresa-id');
```

## 🎯 Benefícios

- ✅ **Automático**: Não precisa definir matrícula manualmente
- ✅ **Consistente**: Padrão uniforme para todas as empresas
- ✅ **Escalável**: Suporta até 99 empresas (01-99)
- ✅ **Sequencial**: Cada funcionário recebe o próximo número disponível
- ✅ **Organizado**: Fácil identificação da empresa pela matrícula

## 🧪 Testes Realizados

- ✅ Geração automática de matrícula para Empresa 01
- ✅ Geração automática de matrícula para Empresa 02
- ✅ Sequência incremental por empresa
- ✅ Trigger funcionando corretamente
- ✅ Validação de formato de matrícula

O sistema está pronto para uso em produção! 🚀
