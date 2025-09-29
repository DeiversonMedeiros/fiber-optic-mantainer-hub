# Componentes de Notificações de Férias

Este diretório contém componentes para exibir e gerenciar notificações de férias no sistema.

## Componentes Disponíveis

### 1. VacationNotificationWidget

Widget para exibir notificações de férias de um funcionário específico.

```tsx
import { VacationNotificationWidget } from '@/components/vacation';

<VacationNotificationWidget 
  employeeId={user?.id}
  className="w-full"
/>
```

**Props:**
- `employeeId?: string` - ID do funcionário (opcional, usa usuário atual se não fornecido)
- `className?: string` - Classes CSS adicionais

### 2. VacationStatusCard

Card para exibir o status atual das férias de um funcionário.

```tsx
import { VacationStatusCard } from '@/components/vacation';

<VacationStatusCard 
  employeeId={user?.id}
  showActions={true}
  onScheduleVacation={() => setIsDialogOpen(true)}
  onViewDetails={() => navigate('/details')}
/>
```

**Props:**
- `employeeId?: string` - ID do funcionário
- `className?: string` - Classes CSS adicionais
- `showActions?: boolean` - Mostrar botões de ação (padrão: true)
- `onScheduleVacation?: () => void` - Callback para agendar férias
- `onViewDetails?: () => void` - Callback para ver detalhes

### 3. VacationAlertsDashboard

Dashboard completo para gestores de RH visualizarem alertas e métricas de férias.

```tsx
import { VacationAlertsDashboard } from '@/components/vacation';

<VacationAlertsDashboard 
  companyId={company.id}
  showActions={true}
  onGenerateNotifications={() => console.log('Gerar notificações')}
  onExportReport={() => console.log('Exportar relatório')}
/>
```

**Props:**
- `companyId?: string` - ID da empresa
- `className?: string` - Classes CSS adicionais
- `showActions?: boolean` - Mostrar botões de ação (padrão: true)
- `onGenerateNotifications?: () => void` - Callback para gerar notificações
- `onExportReport?: () => void` - Callback para exportar relatório

### 4. VacationNotificationBadge

Badge para mostrar contador de notificações não lidas.

```tsx
import { VacationNotificationBadge } from '@/components/vacation';

<VacationNotificationBadge 
  employeeId={user?.id}
  showIcon={true}
  size="md"
/>
```

**Props:**
- `employeeId?: string` - ID do funcionário
- `className?: string` - Classes CSS adicionais
- `showIcon?: boolean` - Mostrar ícone (padrão: true)
- `size?: 'sm' | 'md' | 'lg'` - Tamanho do badge (padrão: 'sm')

## Hooks Disponíveis

### useVacationNotifications

Hook para gerenciar notificações de férias.

```tsx
import { useVacationNotifications, useVacationNotificationsCount } from '@/hooks/useVacation';

const { data: notifications } = useVacationNotifications(employeeId);
const { data: unreadCount } = useVacationNotificationsCount(employeeId);
```

### useVacationDashboard

Hook para dados do dashboard de férias.

```tsx
import { useVacationAlerts, useVacationDashboardMetrics } from '@/hooks/useVacation';

const { data: alerts } = useVacationAlerts(companyId);
const { data: metrics } = useVacationDashboardMetrics(companyId);
```

## Integração

### Portal do Colaborador

Os componentes foram integrados na página `src/pages/portal-colaborador/FeriasPage.tsx`:

- Widget de notificações na parte superior
- Card de status ao lado das notificações
- Integração com formulário de solicitação de férias

### Gestão de Férias RH

Os componentes foram integrados na página `src/pages/VacationsManagement.tsx`:

- Dashboard de alertas acima do conteúdo principal
- Métricas de conformidade
- Ações para gerar notificações e exportar relatórios

## Funcionalidades

### Para Funcionários
- ✅ Ver notificações de férias em tempo real
- ✅ Status de conformidade das férias
- ✅ Alertas de criticidade
- ✅ Ações rápidas para agendar férias
- ✅ Histórico de solicitações

### Para RH/Gestores
- ✅ Dashboard completo de alertas
- ✅ Métricas de conformidade da empresa
- ✅ Lista de funcionários com problemas
- ✅ Geração manual de notificações
- ✅ Relatórios de exportação

## Dependências

- `@tanstack/react-query` - Para cache e sincronização de dados
- `@supabase/supabase-js` - Para comunicação com o banco
- `lucide-react` - Para ícones
- `@/components/ui/*` - Componentes base do projeto
- `@/hooks/useAuth` - Para autenticação
- `@/hooks/useCompany` - Para dados da empresa

## Notas de Implementação

1. **Cache**: Os hooks usam React Query para cache automático e sincronização
2. **Permissões**: As consultas respeitam as políticas RLS do Supabase
3. **Responsividade**: Todos os componentes são responsivos
4. **Acessibilidade**: Componentes seguem padrões de acessibilidade
5. **Performance**: Consultas otimizadas com refetch interval configurável
