# Sistema de Cálculo Dinâmico de Benefícios (VR/VA e Transporte)

## Visão Geral

O sistema foi atualizado para calcular automaticamente os valores mensais de VR/VA e Transporte baseado em dias úteis reais, considerando:

- **Turnos de trabalho** configurados para cada funcionário
- **Feriados** cadastrados no sistema
- **Ausências, férias e licenças** médicas
- **Regras de desconto** configuráveis

## Arquivos Criados/Modificados

### 1. Funções SQL (`create_work_days_calculation_functions.sql`)

#### `rh.calculate_employee_work_days()`
- Calcula dias úteis de um funcionário em um mês específico
- Considera turno de trabalho, feriados e ausências
- Retorna: total_days, work_days, holidays_count, absences_count, vacation_days, sick_leave_days, effective_work_days

#### `rh.calculate_vr_va_monthly_value()`
- Calcula valor mensal de VR/VA baseado em dias úteis reais
- Aplica descontos conforme configurações
- Retorna: valor_diario, dias_uteis_mes, dias_feriados, dias_ausencia, dias_ferias, dias_licenca, dias_efetivos_trabalho, valor_bruto, valor_desconto_ausencia, valor_desconto_ferias, valor_desconto_licenca, valor_total_desconto, valor_final

#### `rh.calculate_transporte_monthly_value()`
- Calcula valor mensal de transporte baseado em dias úteis reais
- Considera quantidade de passagens por dia (ida e volta)
- Aplica descontos conforme configurações
- Retorna: valor_passagem, quantidade_passagens, dias_uteis_mes, dias_feriados, dias_ausencia, dias_ferias, dias_licenca, dias_efetivos_trabalho, valor_bruto, valor_desconto_ausencia, valor_desconto_ferias, valor_desconto_licenca, valor_total_desconto, valor_final

#### `rh.process_monthly_benefits()`
- Processa automaticamente os benefícios mensais para todos os funcionários
- Evita duplicação de registros
- Retorna: número de benefícios processados

### 2. Componentes React

#### `EmployeeVrVaDynamic.tsx`
- Interface para configuração de VR/VA com cálculo automático
- Mostra resumo de dias úteis em tempo real
- Permite ajustes manuais quando necessário
- Calcula automaticamente valores baseados em dias úteis

#### `EmployeeTransporteDynamic.tsx`
- Interface para configuração de transporte com cálculo automático
- Mostra resumo de dias úteis em tempo real
- Considera quantidade de passagens por dia
- Permite ajustes manuais quando necessário

#### `BenefitsProcessingTool.tsx`
- Ferramenta para processamento automático de benefícios mensais
- Mostra estatísticas da empresa
- Processa todos os funcionários ativos de uma vez
- Evita duplicação de registros

## Como Usar o Sistema

### 1. Configuração Inicial

#### a) Cadastrar Feriados
```sql
-- Popular feriados nacionais
SELECT public.populate_national_holidays('company-uuid');

-- Popular feriados móveis para um ano específico
SELECT public.populate_mobile_holidays('company-uuid', 2024);

-- Popular todos os feriados para um ano
SELECT public.populate_all_holidays_for_year('company-uuid', 2024);
```

#### b) Configurar Turnos de Trabalho
- Acesse a página de Work Shifts
- Cadastre os turnos da empresa (ex: Segunda a Sexta, 08:00-17:00)
- Atribua turnos aos funcionários na tabela `employee_shifts`

#### c) Configurar Benefícios
- Configure VR/VA na tabela `vr_va_configs`
- Configure transporte na tabela `transporte_configs`
- Defina as regras de desconto (por ausência, férias, licença)

### 2. Uso Diário

#### Para Funcionários Individuais:
1. Acesse o perfil do funcionário
2. Vá para a seção de VR/VA ou Transporte
3. Clique em "Adicionar VR/VA" ou "Adicionar Transporte"
4. Selecione o tipo de benefício e o mês/ano
5. O sistema calculará automaticamente os valores
6. Faça ajustes manuais se necessário
7. Salve a configuração

#### Para Processamento em Lote:
1. Acesse a ferramenta de processamento de benefícios
2. Selecione o mês e ano
3. Clique em "Iniciar Processamento"
4. O sistema processará todos os funcionários ativos automaticamente

### 3. Exemplo de Cálculo

**Funcionário com turno Segunda a Sexta:**
- Setembro 2024: 30 dias
- Dias úteis: 26 dias (seg-sex)
- Feriados: 1 dia (7 de setembro)
- Ausências: 2 dias
- Férias: 0 dias
- Licenças: 0 dias
- **Dias efetivos: 23 dias**

**VR/VA:**
- Valor diário: R$ 15,00
- Valor bruto: 26 × R$ 15,00 = R$ 390,00
- Desconto feriados: 1 × R$ 15,00 = R$ 15,00
- Desconto ausências: 2 × R$ 15,00 = R$ 30,00
- **Valor final: R$ 345,00**

**Transporte:**
- Valor passagem: R$ 4,50
- Quantidade passagens/dia: 2 (ida e volta)
- Valor bruto: 26 × 2 × R$ 4,50 = R$ 234,00
- Desconto feriados: 1 × 2 × R$ 4,50 = R$ 9,00
- Desconto ausências: 2 × 2 × R$ 4,50 = R$ 18,00
- **Valor final: R$ 207,00**

## Vantagens do Sistema

1. **Precisão**: Cálculo baseado em dias úteis reais
2. **Automação**: Reduz trabalho manual e erros
3. **Flexibilidade**: Permite ajustes manuais quando necessário
4. **Transparência**: Mostra detalhamento completo do cálculo
5. **Escalabilidade**: Processa todos os funcionários automaticamente
6. **Auditoria**: Mantém histórico completo de cálculos

## Configurações Importantes

### Regras de Desconto
- `desconto_por_ausencia`: Se true, desconta dias de ausência
- `desconto_por_ferias`: Se true, desconta dias de férias
- `desconto_por_licenca`: Se true, desconta dias de licença médica

### Turnos de Trabalho
- Campo `dias_semana`: Array de inteiros (0=domingo, 1=segunda, etc.)
- Se funcionário não tem turno, usa padrão seg-sex

### Feriados
- Tipos: nacional, estadual, municipal
- Sistema considera todos os feriados ativos da empresa

## Monitoramento e Manutenção

### Verificar Cálculos
```sql
-- Verificar dias úteis de um funcionário
SELECT * FROM rh.calculate_employee_work_days('employee-uuid', 'company-uuid', 2024, 9);

-- Verificar cálculo de VR/VA
SELECT * FROM rh.calculate_vr_va_monthly_value('employee-uuid', 'company-uuid', 'config-uuid', 2024, 9);

-- Verificar cálculo de transporte
SELECT * FROM rh.calculate_transporte_monthly_value('employee-uuid', 'company-uuid', 'config-uuid', 2024, 9);
```

### Processar Benefícios
```sql
-- Processar benefícios para todos os funcionários
SELECT rh.process_monthly_benefits('company-uuid', 2024, 9);
```

## Próximos Passos

1. **Testar** o sistema com dados reais
2. **Treinar** os usuários no novo sistema
3. **Migrar** dados existentes se necessário
4. **Configurar** feriados e turnos para todas as empresas
5. **Processar** benefícios retroativos se necessário

## Suporte

Para dúvidas ou problemas:
1. Verifique se os feriados estão cadastrados
2. Confirme se os turnos estão configurados
3. Verifique as configurações de benefícios
4. Consulte os logs de erro no console do navegador
5. Execute as funções SQL manualmente para debug


























