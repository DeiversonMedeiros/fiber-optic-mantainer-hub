# 🧮 Serviços de Cálculo de Folha de Pagamento

Este diretório contém os serviços responsáveis pelos cálculos avançados de folha de pagamento do sistema RH.

## 📁 Estrutura

```
src/services/rh/calculations/
├── PayrollCalculationService.ts    # Serviço principal de cálculos
└── README.md                       # Esta documentação
```

## 🚀 Funcionalidades Implementadas

### ✅ **Fase 1 - Motor de Cálculos Automáticos**

#### 1. **Cálculo de Horas Extras**
- ✅ Cálculo automático baseado em registros de ponto
- ✅ Integração com `time_records` e `work_schedules`
- ✅ Cálculo de DSR (Descanso Semanal Remunerado)
- ✅ Cálculo de adicional noturno (22h às 6h)
- ✅ Aplicação de 50% de adicional sobre horas extras

#### 2. **Cálculo de Férias**
- ✅ Férias proporcionais baseadas em meses trabalhados
- ✅ Cálculo de 1/3 constitucional
- ✅ Suporte a abono pecuniário (estrutura preparada)

#### 3. **Cálculo de 13º Salário**
- ✅ 13º salário integral
- ✅ Cálculo proporcional para funcionários admitidos no ano
- ✅ Baseado em meses trabalhados

#### 4. **Cálculo de Impostos**
- ✅ INSS baseado em faixas configuráveis
- ✅ IRRF com dedução de dependentes
- ✅ FGTS com alíquota configurável
- ✅ Contribuições sindicais

## 🔧 Como Usar

### Exemplo Básico

```typescript
import { PayrollCalculationService } from '@/services/rh/calculations/PayrollCalculationService';

// Inicializar o serviço
const calculationService = new PayrollCalculationService(companyId);

// Calcular horas extras
const overtimeResult = await calculationService.calculateOvertime(
  employeeId, 
  '2024-01'
);

// Calcular férias
const vacationResult = await calculationService.calculateVacation(
  employeeId, 
  '2024-01'
);

// Calcular 13º salário
const thirteenthResult = await calculationService.calculateThirteenthSalary(
  employeeId, 
  2024
);
```

### Usando o Hook

```typescript
import { usePayrollCalculations } from '@/hooks/rh/payroll/usePayrollCalculations';

function MyComponent() {
  const { 
    calculateOvertime, 
    calculateVacation, 
    calculateThirteenthSalary,
    loading, 
    error 
  } = usePayrollCalculations();

  const handleCalculate = async () => {
    const result = await calculateOvertime('employee-id', '2024-01');
    console.log('Resultado:', result);
  };

  return (
    <button onClick={handleCalculate} disabled={loading}>
      {loading ? 'Calculando...' : 'Calcular'}
    </button>
  );
}
```

## 📊 Estrutura de Dados

### OvertimeCalculation
```typescript
interface OvertimeCalculation {
  employeeId: string;
  period: string;
  regularHours: number;        // Horas regulares trabalhadas
  overtimeHours: number;       // Horas extras
  overtimeValue: number;       // Valor das horas extras (50% adicional)
  dsrValue: number;           // DSR sobre horas extras
  nightShiftHours: number;    // Horas noturnas
  nightShiftValue: number;    // Adicional noturno (20%)
  totalOvertimeValue: number; // Valor total
}
```

### VacationCalculation
```typescript
interface VacationCalculation {
  employeeId: string;
  period: string;
  vacationDays: number;        // Dias de férias proporcionais
  vacationValue: number;       // Valor das férias
  constitutionalThird: number; // 1/3 constitucional
  cashAllowance: number;       // Abono pecuniário
  totalVacationValue: number;  // Valor total
}
```

### ThirteenthSalaryCalculation
```typescript
interface ThirteenthSalaryCalculation {
  employeeId: string;
  year: number;
  proportionalMonths: number;  // Meses trabalhados no ano
  thirteenthValue: number;     // Valor do 13º integral
  proportionalValue: number;   // Valor proporcional
  totalValue: number;          // Valor final
}
```

## 🗄️ Integração com Banco de Dados

### Tabelas Utilizadas

- **`time_records`** - Registros de ponto dos funcionários
- **`work_schedules`** - Jornadas de trabalho configuradas
- **`employment_contracts`** - Contratos com salários base
- **`employees`** - Dados dos funcionários
- **`inss_brackets`** - Faixas de INSS
- **`irrf_brackets`** - Faixas de IRRF
- **`fgts_config`** - Configurações de FGTS

### Dependências

- **Supabase Client** - Para consultas ao banco
- **React Query** - Para cache e gerenciamento de estado
- **Zod** - Para validação de dados
- **React Hook Form** - Para formulários

## 🎯 Próximas Implementações

### Fase 2 - Cálculos Tributários Avançados
- [ ] Sistema de descontos de convênios
- [ ] Cálculo de contribuições sindicais avançadas
- [ ] Integração com eSocial

### Fase 3 - Adicionais e Benefícios
- [ ] Cálculo de periculosidade
- [ ] Cálculo de insalubridade
- [ ] Sistema de PLR (Participação nos Lucros)
- [ ] Cálculo de sobreaviso

### Fase 4 - Ausências e Rescisões
- [ ] Cálculo de descontos por faltas
- [ ] Cálculo de descontos por atrasos
- [ ] Sistema de rescisões completo
- [ ] Cálculo de aviso prévio

## 🧪 Testes

Para testar as funcionalidades:

1. **Acesse a página**: `/rh/payroll-advanced`
2. **Selecione um funcionário** com registros de ponto
3. **Escolha um período** (mês/ano)
4. **Clique em "Calcular"** para ver os resultados

## 📝 Notas Importantes

- Os cálculos seguem a legislação trabalhista brasileira
- As alíquotas e valores podem ser configurados via interface
- O sistema é extensível para novos tipos de cálculo
- Todos os cálculos são auditáveis e rastreáveis

## 🔧 Configuração

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Dependências do Package.json
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.0.0"
  }
}
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme se as tabelas do banco estão populadas
3. Verifique as permissões do usuário
4. Consulte a documentação do Supabase

---

**Desenvolvido para o Sistema de Gestão de Manutenção de Fibra Óptica**  
*Versão 1.0.0 - Janeiro 2024*
