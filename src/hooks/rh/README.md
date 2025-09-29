# Hooks do Módulo RH (Recursos Humanos)

Este diretório contém hooks personalizados para gerenciar todas as operações do módulo de Recursos Humanos.

## 🚀 Hooks Disponíveis

### 1. `useEmployees` - Gestão de Funcionários
Gerencia cadastro, atualização e consulta de funcionários.

```typescript
import { useEmployees } from '@/hooks/rh';

const { 
  employees, 
  isLoading, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} = useEmployees(companyId);

// Buscar funcionário específico
const { useEmployee } = useEmployees(companyId);
const { data: employee } = useEmployee(employeeId);

// Buscar por status
const { useEmployeesByStatus } = useEmployees(companyId);
const { data: ativos } = useEmployeesByStatus('ativo');
```

### 2. `usePositions` - Gestão de Cargos
Gerencia cargos, posições e hierarquias organizacionais.

```typescript
import { usePositions } from '@/hooks/rh';

const { 
  positions, 
  activePositions, 
  createPosition, 
  updatePosition, 
  togglePositionStatus 
} = usePositions(companyId);

// Buscar cargo específico
const { usePosition } = usePositions(companyId);
const { data: position } = usePosition(positionId);

// Buscar por nível hierárquico
const { usePositionsByLevel } = usePositions(companyId);
const { data: gerentes } = usePositionsByLevel(3);
```

### 3. `useTimeRecords` - Ponto Eletrônico
Gerencia registros de ponto, entrada, saída e intervalos.

```typescript
import { useTimeRecords } from '@/hooks/rh';

const { 
  timeRecords, 
  createTimeRecord, 
  updateTimeRecord, 
  approveTimeRecord,
  calculateWorkedHours 
} = useTimeRecords(companyId);

// Buscar ponto por funcionário
const { useTimeRecordsByEmployee } = useTimeRecords(companyId);
const { data: pontoFuncionario } = useTimeRecordsByEmployee(employeeId, '2024-01-01', '2024-01-31');

// Buscar ponto por data
const { useTimeRecordsByDate } = useTimeRecords(companyId);
const { data: pontoData } = useTimeRecordsByDate('2024-01-15');

// Calcular horas trabalhadas
const horasTrabalhadas = calculateWorkedHours(timeRecord);
```

### 4. `useBenefits` - Gestão de Benefícios
Gerencia benefícios, valores e tipos de remuneração.

```typescript
import { useBenefits } from '@/hooks/rh';

const { 
  benefits, 
  activeBenefits, 
  createBenefit, 
  updateBenefit, 
  calculateBenefitValue,
  validateBenefit 
} = useBenefits(companyId);

// Buscar por tipo
const { useBenefitsByType } = useBenefits(companyId);
const { data: beneficiosFixos } = useBenefitsByType('valor_fixo');

// Calcular valor do benefício
const valorBeneficio = calculateBenefitValue(benefit, salarioBase);

// Validar dados
const erros = validateBenefit(benefitData);
```

### 5. `useVacations` - Gestão de Férias
Gerencia solicitações, aprovações e controle de férias.

```typescript
import { useVacations } from '@/hooks/rh';

const { 
  vacations, 
  pendingVacations, 
  createVacation, 
  approveVacation, 
  calculateVacationDays,
  validateVacation 
} = useVacations(companyId);

// Buscar férias do funcionário
const { useVacationsByEmployee } = useVacations(companyId);
const { data: feriasFuncionario } = useVacationsByEmployee(employeeId, 2024);

// Buscar férias do ano
const { useVacationsByYear } = useVacations(companyId);
const { data: feriasAno } = useVacationsByYear(2024);

// Calcular dias de férias
const diasFerias = calculateVacationDays(vacation);

// Aprovar/Rejeitar férias
approveVacation.mutate({ 
  id: vacationId, 
  approvedBy: userId, 
  status: 'aprovado' 
});
```

### 6. `usePayroll` - Folha de Pagamento
Gerencia folhas de pagamento, itens e processamento.

```typescript
import { usePayroll } from '@/hooks/rh';

const { 
  payrolls, 
  createPayroll, 
  processPayroll, 
  addPayrollItem, 
  calculatePayrollTotals,
  validatePayroll 
} = usePayroll(companyId);

// Buscar folha por competência
const { usePayrollByCompetencia } = usePayroll(companyId);
const { data: folha } = usePayrollByCompetencia('2024-01');

// Buscar itens da folha
const { usePayrollItems } = usePayroll(companyId);
const { data: itens } = usePayrollItems(payrollId);

// Buscar folha do funcionário
const { usePayrollByEmployee } = usePayroll(companyId);
const { data: folhaFuncionario } = usePayrollByEmployee(employeeId, '2024-01');

// Calcular totais
const { proventos, descontos, liquido } = calculatePayrollTotals(itens);

// Processar folha
processPayroll.mutate(payrollId);
```

## 🔧 Características dos Hooks

### ✅ **Cache Inteligente**
- **React Query** para gerenciamento de estado e cache
- **Stale time** configurado por tipo de dado
- **Invalidation automática** de caches relacionados

### ✅ **Multi-tenancy**
- Todos os hooks aceitam `companyId` para isolamento
- Filtros automáticos por empresa
- Segurança de dados por tenant

### ✅ **Logs Detalhados**
- Console logs para debugging
- Emojis para identificação visual
- Rastreamento de operações CRUD

### ✅ **Validação e Utilitários**
- Funções de validação integradas
- Cálculos automáticos (horas, dias, valores)
- Tratamento de erros consistente

### ✅ **Mutations Otimizadas**
- **onSuccess** com invalidação de cache
- **onError** com logs detalhados
- **Optimistic updates** quando apropriado

## 📊 Estrutura de Cache

Cada hook usa chaves de cache organizadas:

```typescript
const KEYS = {
  all: ['rh', 'entity'],
  lists: () => [...KEYS.all, 'list'],
  list: (filters) => [...KEYS.lists(), { filters }],
  details: () => [...KEYS.all, 'detail'],
  detail: (id) => [...KEYS.details(), id],
  // Chaves específicas por entidade
};
```

## 🚨 Tratamento de Erros

Todos os hooks incluem:

- **Try/catch** nas operações de banco
- **Console.error** com contexto detalhado
- **Throw** para propagar erros ao React Query
- **Fallbacks** para dados nulos/undefined

## 📱 Uso em Componentes

```typescript
import { useEmployees, usePositions } from '@/hooks/rh';

function EmployeeList() {
  const { employees, isLoading, createEmployee } = useEmployees(companyId);
  const { positions } = usePositions(companyId);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {employees.map(employee => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}
```

## 🔄 Atualizações de Cache

Os hooks automaticamente:

1. **Invalidam** caches relacionados após mutations
2. **Atualizam** caches específicos para otimização
3. **Removem** caches deletados
4. **Sincronizam** dados entre diferentes views

## 📈 Performance

- **Stale time** configurado por frequência de mudança
- **GC time** para limpeza automática de cache
- **Queries habilitadas** apenas quando necessário
- **Ordenação** otimizada no banco de dados




